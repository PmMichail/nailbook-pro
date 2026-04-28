import { Router } from 'express';
import prisma from '../models/prismaClient';
import { sendTelegramMessage } from '../services/telegram';
import { sendPushNotification } from '../services/firebase';
// In a real app we'd verify JWT, but we'll extract masterId manually or from headers.
// We'll assume the client app sends authorization header and we mock user decoding.
import jwt from 'jsonwebtoken';
import { getIo, getSocketId } from '../socket/index';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const router = Router();

// Middleware Mock for JWT decoding
const authAny = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireMaster = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'MASTER') return res.status(403).json({ error: 'Not a master' });
  next();
};

router.use(authAny);

// POST /connection-code
router.post('/connection-code', async (req: any, res) => {
   if (req.user?.role !== 'MASTER') return res.status(403).json({ error: 'Not a master' });
   try {
       const codeStr = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
       const expiresAt = new Date();
       expiresAt.setHours(expiresAt.getHours() + 24); // Valid for 24h
       
       await prisma.connectionCode.upsert({
           where: { userId: req.user.id },
           update: { code: codeStr, expiresAt },
           create: { userId: req.user.id, code: codeStr, expiresAt }
       });
       res.json({ code: codeStr, expiresAt });
   } catch(e) {
       res.status(500).json({ error: 'Server error' });
   }
});

// GET /settings
router.get('/settings', async (req: any, res) => {
  const masterId = req.user.id;
  const settings = await prisma.masterWeeklySettings.findMany({
    where: { masterId },
    orderBy: { dayOfWeek: 'asc' }
  });
  res.json(settings);
});

// PUT /settings
router.put('/settings', async (req: any, res) => {
  const masterId = req.user.id;
  const { weeklySettings } = req.body; 
  console.log(`[BACKEND] PUT /settings received for master ${masterId}`);
  try {
    // Delete old and recreate
    await prisma.masterWeeklySettings.deleteMany({ where: { masterId } });
    const formattedData = weeklySettings.map((s: any) => ({
      masterId,
      dayOfWeek: Number(s.dayOfWeek),
      workStart: s.workStart,
      workEnd: s.workEnd,
      timePerClient: Number(s.timePerClient),
      breakStart: s.breakStart || null,
      breakEnd: s.breakEnd || null,
      isWorking: Boolean(s.isWorking)
    }));
    await prisma.masterWeeklySettings.createMany({
      data: formattedData
    });
    const newSettings = await prisma.masterWeeklySettings.findMany({ where: { masterId }});
    console.log(`[BACKEND] Settings successfully saved.`);
    res.json(newSettings);
  } catch(e) {
    console.error(`[BACKEND ERROR]`, e);
    res.status(500).json({ error: 'Помилка збереження налаштувань' });
  }
});

// GET /slots?date=YYYY-MM-DD
// Auto-generates slots based on weekly settings
router.get('/slots', async (req: any, res) => {
  const masterId = req.user.id;
  const dateStr = req.query.date; // expecting YYYY-MM-DD
  if (!dateStr) return res.status(400).json({ error: 'date required' });
  
  const dateObj = new Date(dateStr);
  let dayOfWeek = dateObj.getDay(); 
  if (dayOfWeek === 0) dayOfWeek = 7; // Convert Sun(0) to 7
  
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
  const slots = [];

  while (currentMinutes + duration <= endMinutes) {
    // Check break time
    if (settings.breakStart && settings.breakEnd) {
       const [bStartH, bStartM] = settings.breakStart.split(':').map(Number);
       const [bEndH, bEndM] = settings.breakEnd.split(':').map(Number);
       const breakStartMins = bStartH * 60 + bStartM;
       const breakEndMins = bEndH * 60 + bEndM;
       if (currentMinutes + duration > breakStartMins && currentMinutes < breakEndMins) {
           currentMinutes += duration; // Skip this slot since it overlaps with break
           continue;
       }
    }

    const h = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
    const m = (currentMinutes % 60).toString().padStart(2, '0');
    const timeStr = `${h}:${m}`;
    
    const isBlocked = blocked.some(b => b.time === timeStr);
    const hasApp = appointments.find(a => a.time === timeStr && a.status !== 'CANCELLED');

    slots.push({
      time: timeStr,
      isBlocked,
      appointment: hasApp || null
    });
    currentMinutes += duration;
  }
  
  res.json({ slots });
});

// POST /slots/block
router.post('/slots/block', async (req: any, res) => {
  const { date, time, reason } = req.body;
  const blocked = await prisma.blockedSlot.create({
    data: { masterId: req.user.id, date: new Date(date), time, reason }
  });
  res.json(blocked);
});

// DELETE /slots/unblock
router.delete('/slots/unblock', async (req: any, res) => {
  const { date, time } = req.body; // Can send in body or query
  await prisma.blockedSlot.deleteMany({
    where: { masterId: req.user.id, date: new Date(date), time }
  });
  res.json({ success: true });
});

// GET /appointments
router.get('/appointments', async (req: any, res) => {
  console.log('[DEBUG] GET /api/master/appointments by user:', req.user.id);
  
  // Для того, щоб gte працювало з початку сьогоднішнього дня:
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const appointments = await prisma.appointment.findMany({
    where: { 
      masterId: req.user.id,
      date: { gte: today } 
    },
    include: { 
      client: { 
        select: { id: true, name: true, phone: true } 
      } 
    },
    orderBy: { date: 'asc' }
  });
  console.log(`[DEBUG] Found ${appointments.length} appointments for master ${req.user.id}`);
  res.json(appointments);
});

// GET /appointments/by-date
router.get('/appointments/by-date', async (req: any, res) => {
  const dateStr = req.query.date;
  if (!dateStr) return res.status(400).json({ error: 'date required' });
  
  const appointments = await prisma.appointment.findMany({
    where: {
      masterId: req.user.id,
      date: new Date(dateStr),
      isArchived: false
    },
    include: {
      client: { select: { id: true, name: true, phone: true } }
    },
    orderBy: { time: 'asc' }
  });
  
  let totalSum = 0;
  appointments.forEach((app: any) => {
     if (app.status !== 'CANCELLED') {
        const price = app.finalPrice || app.originalPrice || app.price || 0;
        totalSum += price;
     }
  });
  
  res.json({ appointments, totalSum, count: appointments.filter(a => a.status !== 'CANCELLED').length });
});

// PUT /appointments/archive-old
router.put('/appointments/archive-old', async (req: any, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const updated = await prisma.appointment.updateMany({
    where: {
      masterId: req.user.id,
      date: { lt: today },
      isArchived: false
    },
    data: {
      isArchived: true
    }
  });
  res.json({ success: true, count: updated.count });
});

// PUT /appointments/:id/confirm
router.put('/appointments/:id/confirm', async (req: any, res) => {
  const { price, note, prepaymentRequired, prepaymentAmount } = req.body || {};
  const masterId = req.user.id;

  // Get master payment info
  const paymentInfo = await prisma.paymentInfo.findUnique({ where: { masterId } });
  
  const isPrepayment = prepaymentRequired && prepaymentAmount > 0;
  
  const updateData: any = { 
     status: isPrepayment ? 'AWAITING_PREPAYMENT' : 'CONFIRMED' 
  };
  
  if (price !== undefined) {
    updateData.finalPrice = parseInt(price, 10);
  }
  
  if (isPrepayment) {
     updateData.prepaymentAmount = parseInt(prepaymentAmount, 10);
     const deadline = new Date();
     deadline.setHours(deadline.getHours() + 3);
     updateData.prepaymentDeadline = deadline;
  }
  
  if (paymentInfo) {
    updateData.paymentDetails = {
       qrCode: paymentInfo.qrCodeUrl,
       cardNumber: paymentInfo.cardNumber,
       bankName: paymentInfo.bankName
    };
  }

  const app = await prisma.appointment.update({
    where: { id: req.params.id },
    data: updateData,
    include: { client: { include: { pushToken: true } }, master: true }
  });
  
  let msg = isPrepayment 
      ? `Ваш запис на ${app.date.toISOString().split('T')[0]} о ${app.time} очікує передоплату (${prepaymentAmount} грн) до ${updateData.prepaymentDeadline?.toLocaleTimeString('uk-UA', {hour: '2-digit', minute:'2-digit'})}. Зробіть переказ, інакше він скасується.`
      : `Ваш запис на ${app.date.toISOString().split('T')[0]} о ${app.time} ПІДТВЕРДЖЕНО.`;
      
  if (note && !isPrepayment) msg += ` Примітка майстра: ${note}`;
  
  sendTelegramMessage(app.clientId, msg);
  if (app.client?.pushToken?.token) {
      await sendPushNotification(
          app.client.pushToken.token,
          isPrepayment ? 'Очікується передоплата' : 'Запис підтверджено',
          msg
      );
  }

  // Socket emit
  const socketId = getSocketId(app.clientId);
  if (socketId) {
     getIo().to(socketId).emit('appointment_updated', app);
  }

  res.json(app);
});

// PUT /appointments/:id/confirm-prepayment
router.put('/appointments/:id/confirm-prepayment', async (req: any, res) => {
  const app = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status: 'CONFIRMED' },
    include: { client: { include: { pushToken: true } }, master: true }
  });
  sendTelegramMessage(app.clientId, `Оплату авансу підтверджено! Ваш запис на ${app.date.toISOString().split('T')[0]} о ${app.time} ПІДТВЕРДЖЕНО.`);
  if (app.client?.pushToken?.token) {
      await sendPushNotification(
          app.client.pushToken.token,
          'Запис підтверджено',
          `Майстер підтвердив отримання передоплати. Запис на ${app.date.toISOString().split('T')[0]} підтверджено.`
      );
  }
  
  const socketId = getSocketId(app.clientId);
  if (socketId) {
     getIo().to(socketId).emit('appointment_updated', app);
  }

  res.json(app);
});

// PUT /appointments/:id/cancel
router.put('/appointments/:id/cancel', async (req: any, res) => {
  const app = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' },
    include: { client: { include: { pushToken: true } }, master: true }
  });
  sendTelegramMessage(app.clientId, `Ваш запис на ${app.date.toISOString().split('T')[0]} о ${app.time} СКАСОВАНО.`);
  if (app.client?.pushToken?.token) {
      await sendPushNotification(
          app.client.pushToken.token,
          'Запис скасовано',
          `Майстер ${app.master?.name || ''} відхилив Ваш запис на ${app.date.toISOString().split('T')[0]}.`
      );
  }
  res.json(app);
});

// PUT /appointments/:id/complete
router.put('/appointments/:id/complete', async (req: any, res) => {
  const app = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status: 'COMPLETED' }
  });
  res.json(app);
});

// GET /statistics
router.get('/statistics', async (req: any, res) => {
  const masterId = req.user.id;
  const { period, date } = req.query; 
  
  let gte = new Date(0); 
  let lte = new Date();
  lte.setFullYear(lte.getFullYear() + 10);

  if (period && date) {
    const d = new Date(date);
    if (period === 'week') {
       gte = new Date(d); gte.setDate(d.getDate() - d.getDay() + 1);
       lte = new Date(gte); lte.setDate(gte.getDate() + 6);
    } else if (period === 'month') {
       gte = new Date(d.getFullYear(), d.getMonth(), 1);
       lte = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    } else if (period === 'year') {
       gte = new Date(d.getFullYear(), 0, 1);
       lte = new Date(d.getFullYear(), 11, 31, 23, 59, 59);
    }
  }

  const apps = await prisma.appointment.findMany({
    where: { masterId, date: { gte, lte }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
    orderBy: { date: 'asc' }
  });

  let totalIncome = 0;
  const serviceCount: any = {};
  const dayCount: any = {};
  const clientIds = new Set();
  
  const daysMap = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];

  apps.forEach((a: any) => {
     const price = a.finalPrice || a.originalPrice || a.price || 0;
     totalIncome += price;
     clientIds.add(a.clientId);
     
     if (a.service) {
        if (!serviceCount[a.service]) serviceCount[a.service] = { count: 0, income: 0};
        serviceCount[a.service].count++;
        serviceCount[a.service].income += price;
     }

     const dName = daysMap[new Date(a.date).getDay()];
     dayCount[dName] = (dayCount[dName] || 0) + 1;
  });

  const popularServices = Object.keys(serviceCount).map(k => ({
     service: k, count: serviceCount[k].count, income: serviceCount[k].income
  })).sort((a,b) => b.count - a.count);

  const popularDays = Object.keys(dayCount).map(k => ({
     day: k, count: dayCount[k]
  })).sort((a,b) => b.count - a.count);

  res.json({
    period: period || 'all',
    totalAppointments: apps.length,
    totalIncome,
    averageCheck: apps.length > 0 ? Math.round(totalIncome / apps.length) : 0,
    newClients: clientIds.size, 
    popularServices,
    popularDays,
    popularHours: []
  });
});

// GET /payment-details
router.get('/payment-details', async (req: any, res) => {
  const masterId = req.user.id;
  const paymentInfo = await prisma.paymentInfo.findUnique({ where: { masterId } });
  res.json({ isConnected: !!paymentInfo, info: paymentInfo });
});

// PUT /payment-details
router.put('/payment-details', async (req: any, res) => {
  const masterId = req.user.id;
  const { 
     cardNumber, bankName, paymentLink, 
     requirePrepaymentGlobal, globalPrepaymentAmount,
     liqpayPublicKey, liqpayPrivateKey
  } = req.body;
  
  const updateObj = { 
     cardNumber, 
     bankName, 
     fullName: '', 
     qrCodeUrl: paymentLink,
     requirePrepaymentGlobal: Boolean(requirePrepaymentGlobal),
     globalPrepaymentAmount: globalPrepaymentAmount ? parseInt(globalPrepaymentAmount, 10) : null,
     liqpayPublicKey,
     liqpayPrivateKey
  };
  
  const p = await prisma.paymentInfo.upsert({
    where: { masterId },
    update: updateObj,
    create: { masterId, ...updateObj }
  });
  
  res.json({ success: true, info: p });
});

router.post('/blocked-phones', authAny, requireMaster, async (req: any, res) => {
  try {
    const { phone, reason } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone is required' });
    const blocked = await prisma.blockedPhone.create({
      data: { masterId: req.user.id, phone, reason }
    });
    res.json(blocked);
  } catch (error) {
    res.status(500).json({ error: 'Помилка або номер вже заблоковано' });
  }
});

router.get('/blocked-phones', authAny, requireMaster, async (req: any, res) => {
  try {
    const list = await prisma.blockedPhone.findMany({ where: { masterId: req.user.id } });
    res.json(list);
  } catch(e) {
    res.status(500).json({ error: 'Server err' });
  }
});

// GET /prices
router.get('/prices', async (req: any, res) => {
  const prices = await prisma.priceList.findMany({
    where: { masterId: req.user.id },
    orderBy: { createdAt: 'asc' }
  });
  res.json(prices);
});

// POST /prices
router.post('/prices', async (req: any, res) => {
  const { service, price, duration, imageUrl } = req.body;
  
  const sub = await prisma.subscription.findUnique({ where: { masterId: req.user.id } });
  const isFree = !sub || sub.plan === 'FREE' || ['EXPIRED', 'CANCELLED'].includes(sub.status);
  
  if (isFree) {
    const pricesCount = await prisma.priceList.count({ where: { masterId: req.user.id } });
    if (pricesCount >= 1) {
      return res.status(403).json({ error: 'Ліміт тарифу FREE: лише 1 послуга. Оновіть до PRO.' });
    }
  }

  const p = await prisma.priceList.create({
    data: { masterId: req.user.id, service, price, duration, imageUrl }
  });
  res.json(p);
});

// PUT /prices
router.put('/prices', async (req: any, res) => {
  const { id, service, price, duration, imageUrl } = req.body;
  const p = await prisma.priceList.update({
    where: { id },
    data: { service, price, duration, imageUrl }
  });
  res.json(p);
});

// DELETE /prices/:id
router.delete('/prices/:id', async (req: any, res) => {
  console.error(`[PRICE DELETE] Attempting to delete price id: ${req.params.id}`);
  try {
    await prisma.priceList.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch(e) {
    console.error(`[PRICE DELETE ERROR]`, e);
    res.status(500).json({ error: 'Failed to delete price' });
  }
});

// ==================== CLIENT BOOK ====================

// GET /clients
router.get('/clients', async (req: any, res) => {
  try {
    const clients = await prisma.user.findMany({
      where: { masterId: req.user.id, role: 'CLIENT', isActiveClient: true },
      select: { 
        id: true, name: true, phone: true, avatarUrl: true, notes: true,
        myAppointments: {
           where: { masterId: req.user.id },
           orderBy: { date: 'desc' },
           take: 1
        }
      }
    });
    res.json(clients);
  } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// GET /clients/:id
router.get('/clients/:id', async (req: any, res) => {
  try {
    const client = await prisma.user.findFirst({
      where: { id: req.params.id, masterId: req.user.id }
    });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json({ id: client.id, name: client.name, phone: client.phone, notes: client.notes, avatarUrl: client.avatarUrl });
  } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// PUT /clients/:id
router.put('/clients/:id', async (req: any, res) => {
  try {
    const { name, phone, notes } = req.body;
    const client = await prisma.user.findFirst({ where: { id: req.params.id, masterId: req.user.id } });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, phone, notes }
    });
    
    res.json(updated);
  } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /clients/:id
router.delete('/clients/:id', async (req: any, res) => {
  try {
    const client = await prisma.user.findFirst({ where: { id: req.params.id, masterId: req.user.id } });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    
    // Instead of completely deleting user, unbind from master
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActiveClient: false }
    });
    
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// GET /clients/:id/appointments
router.get('/clients/:id/appointments', async (req: any, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { masterId: req.user.id, clientId: req.params.id },
      orderBy: { date: 'desc' }
    });
    res.json(appointments);
  } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// POST /send-bulk-notification
router.post('/send-bulk-notification', async (req: any, res) => {
  try {
    const { clientIds, message } = req.body;
    if (!Array.isArray(clientIds) || !message) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    
    const sub = await prisma.subscription.findUnique({ where: { masterId: req.user.id } });
    if (sub && (sub.plan === 'FREE' || ['EXPIRED', 'CANCELLED'].includes(sub.status))) {
        return res.status(403).json({ error: 'Ця функція доступна тільки в тарифі Pro' });
    }
    
    const clientsToNotify = await prisma.user.findMany({
      where: { id: { in: clientIds }, masterId: req.user.id },
      include: { pushToken: true }
    });
    
    for (const c of clientsToNotify) {
      if (c.pushToken?.token) {
        await sendPushNotification(c.pushToken.token, 'Повідомлення від майстра', message);
      }
      // Assuming sendTelegramMessage exists and handles resolving if tg disabled internally or we don't care about failure
      sendTelegramMessage(c.id, message);
    }
    
    res.json({ success: true, sentCount: clientsToNotify.length });
  } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// ==================== SALON BRANDING ====================

// PUT /salon-info
router.put('/salon-info', async (req: any, res) => {
  try {
    const { salonName, salonLogo, lat, lng, instagram, tiktok, facebook, address, city } = req.body;
    const updateData: any = {};
    if (salonName !== undefined) updateData.salonName = salonName;
    if (salonLogo !== undefined) updateData.salonLogo = salonLogo;
    if (lat !== undefined) updateData.lat = parseFloat(lat);
    if (lng !== undefined) updateData.lng = parseFloat(lng);
    if (instagram !== undefined) updateData.instagram = instagram;
    if (tiktok !== undefined) updateData.tiktok = tiktok;
    if (facebook !== undefined) updateData.facebook = facebook;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData
    });

    res.json({ 
      salonName: updated.salonName, 
      salonLogo: updated.salonLogo,
      instagram: updated.instagram,
      tiktok: updated.tiktok,
      facebook: updated.facebook,
      address: updated.address,
      city: updated.city
    });
  } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

export default router;
