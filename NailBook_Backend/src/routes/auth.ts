import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../models/prismaClient';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const formatPhoneNumber = (text: string) => {
  let cleaned = text.replace(/\D/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return '+38' + cleaned;
  }
  if (cleaned.length === 12 && cleaned.startsWith('380')) {
    return '+' + cleaned;
  }
  if (cleaned.length === 9) {
    return '+380' + cleaned;
  }
  return '+' + cleaned;
};

router.post('/register', async (req, res) => {
  try {
    let { name, phone, password, role, city, address, inviteCode, referralCode } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone and password are required' });
    }

    phone = formatPhoneNumber(phone);

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ error: 'Phone already registered' });
    }

    // Referral Code Validation
    let validReferralCodeObj = null;
    if (role !== 'MASTER' && referralCode) {
      validReferralCodeObj = await prisma.referralCode.findUnique({
        where: { code: referralCode }
      });
      if (!validReferralCodeObj) {
        return res.status(400).json({ error: 'Недійсний реферальний код.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'MASTER' ? 'MASTER' : 'CLIENT';

    let linkSlug = null;
    let resolvedMasterId = null;
    
    if (userRole === 'MASTER') {
       linkSlug = Math.random().toString(36).substring(2, 8);
    } else if (userRole === 'CLIENT' && inviteCode) {
       let master = null;

       // Check if it is a 6-digit temporary connection code
       if (/^\d{6}$/.test(inviteCode)) {
           const connection = await prisma.connectionCode.findUnique({ where: { code: inviteCode } });
           if (connection && new Date() <= connection.expiresAt) {
               master = await prisma.user.findUnique({ where: { id: connection.userId } });
           }
       }

       // Fallback to permanent linkSlug if no master found yet
       if (!master) {
           master = await prisma.user.findUnique({ where: { linkSlug: inviteCode } });
       }

       if (master) {
         resolvedMasterId = master.id;
         
         // Enforce Subscription Limits
         const sub = await prisma.subscription.findUnique({ where: { masterId: master.id } });
         // Automatically consider PRO if no sub record exists yet or if it's active PRO/TRIAL
         if (sub && (sub.plan === 'FREE' || ['EXPIRED', 'CANCELLED'].includes(sub.status))) {
             const thirtyDaysAgo = new Date();
             thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
             const clientCount = await prisma.user.count({ 
                 where: { 
                     masterId: master.id, 
                     role: 'CLIENT',
                     OR: [
                         { isActiveClient: true },
                         { myAppointments: { some: { date: { gte: thirtyDaysAgo } } } }
                     ]
                 } 
             });
             if (clientCount >= 10) {
                 return res.status(403).json({ error: 'Ваш майстер досягнув ліміту клієнтів. Зв\'яжіться з ним безпосередньо.' });
             }
         }
       } else {
         return res.status(400).json({ error: 'Майстра за таким кодом не знайдено' });
       }
    }

        // Apply Referral Record
    if (validReferralCodeObj && !resolvedMasterId) {
      const owner = await prisma.user.findUnique({ where: { id: validReferralCodeObj.ownerId } });
      if (owner && owner.masterId) {
          resolvedMasterId = owner.masterId;
      }
    }

    // Now insert the new user
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        role: userRole,
        city,
        address,
        isActiveClient: userRole === 'CLIENT' ? true : false,
        linkSlug,
        defaultDuration: userRole === 'MASTER' ? 120 : null,
        masterId: resolvedMasterId
      },
    });

    if (validReferralCodeObj) {
      await prisma.referralUse.create({
        data: {
          code: validReferralCodeObj.code,
          referredClientId: user.id,
          discountApplied: 10,
          isCodeOwnerDiscountUsed: false
        }
      });
      
      await prisma.referralCode.update({
        where: { id: validReferralCodeObj.id },
        data: { uses: { increment: 1 } }
      });
    }

    if (user.role === 'MASTER') {
      const defaultSettings = Array.from({ length: 7 }, (_, i) => ({
        masterId: user.id,
        dayOfWeek: i + 1,
        workStart: '09:00',
        workEnd: '18:00',
        timePerClient: 120,
        isWorking: i + 1 < 6
      }));
      await prisma.masterWeeklySettings.createMany({
        data: defaultSettings
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role, masterId: user.masterId }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ user: { id: user.id, name: user.name, role: user.role, linkSlug: user.linkSlug, masterId: user.masterId, avatarUrl: user.avatarUrl }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/login', async (req, res) => {
  try {
    let { phone, password } = req.body;
    
    let user;
    if (phone.includes('@')) {
       // Log in by email
       user = await prisma.user.findFirst({ where: { email: phone } });
    } else {
       // Log in by phone
       const fPhone = formatPhoneNumber(phone);
       user = await prisma.user.findFirst({ where: { phone: fPhone } });
    }

    if (!user) {
      return res.status(400).json({ error: 'Користувача не знайдено' });
    }

    // Auto-promote to ADMIN
    if (user.email === 'admin@nailbook.pro' && user.role !== 'ADMIN') {
        user = await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' }
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Неправильний пароль' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, masterId: user.masterId }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ user: { id: user.id, name: user.name, role: user.role, linkSlug: user.linkSlug, masterId: user.masterId, avatarUrl: user.avatarUrl }, token });
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

export default router;
