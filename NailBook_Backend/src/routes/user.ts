import { Router } from 'express';
import prisma from '../models/prismaClient';
import jwt from 'jsonwebtoken';
import multer from 'multer';

import { uploadCloud } from '../services/cloudinary';
// uploadCloud replaces multer({ storage })

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.use(authenticate);

// PUT /api/user/profile
router.put('/profile', uploadCloud.fields([{ name: 'avatar', maxCount: 1 }, { name: 'salonLogo', maxCount: 1 }]), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, password, salonName } = req.body;
    
    let avatarUrl = undefined;
    let salonLogo = undefined;
    
    if (req.files) {
      if (req.files['avatar'] && req.files['avatar'].length > 0) {
        avatarUrl = req.files['avatar'][0].path.replace(/\\/g, '/');
      }
      if (req.files['salonLogo'] && req.files['salonLogo'].length > 0) {
        salonLogo = req.files['salonLogo'][0].path.replace(/\\/g, '/');
      }
    }

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (phone) dataToUpdate.phone = phone; 
    if (avatarUrl) dataToUpdate.avatarUrl = avatarUrl;
    
    if (salonName !== undefined) dataToUpdate.salonName = salonName;
    if (salonLogo) dataToUpdate.salonLogo = salonLogo;
    
    if (req.body.city !== undefined) dataToUpdate.city = req.body.city;
    if (req.body.address !== undefined) dataToUpdate.address = req.body.address;
    if (req.body.instagram !== undefined) dataToUpdate.instagram = req.body.instagram;
    if (req.body.tiktok !== undefined) dataToUpdate.tiktok = req.body.tiktok;
    if (req.body.facebook !== undefined) dataToUpdate.facebook = req.body.facebook;
    
    if (password && password.trim().length > 0) {
      const bcrypt = require('bcrypt');
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
          id: true,
          name: true,
          phone: true,
          avatarUrl: true,
          role: true,
          city: true,
          address: true,
          instagram: true,
          tiktok: true,
          facebook: true,
          lat: true,
          lng: true,
          linkSlug: true,
          salonName: true,
          salonLogo: true
      }
    });

    res.json(updatedUser);
  } catch (err) {
    console.error('[PROFILE UPDATE ERROR]', err);
    res.status(500).json({ error: 'Помилка оновлення профілю' });
  }
});


// GET /api/user/unread-count
router.get('/unread-count', async (req: any, res) => {
  try {
    const userId = req.user.id;
    // Count unread messages in all chats where user is a participant and not the sender
    const unreadMessages = await prisma.message.count({
      where: {
        isRead: false,
        senderId: { not: userId },
        chat: {
          OR: [
            { masterId: userId },
            { clientId: userId }
          ]
        }
      }
    });

    // We can also count pending appointments if they are a master
    let pendingAppointments = 0;
    if (req.user.role === 'MASTER') {
       pendingAppointments = await prisma.appointment.count({
         where: { masterId: userId, status: 'PENDING' }
       });
    }

    res.json({ count: unreadMessages + pendingAppointments });
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/user/profile
router.delete('/profile', async (req: any, res) => {
  try {
    const userId = req.user.id;
    console.log('[DELETE ACCOUNT] User ID:', userId);
    
    // Delete prices, settings, etc cascaded or manually if needed
    try {
      await prisma.masterWeeklySettings.deleteMany({ where: { masterId: userId } });
      console.log('[DELETE ACCOUNT] Deleted masterWeeklySettings');
    } catch(e) {
      console.log('[DELETE ACCOUNT] masterWeeklySettings error (may not exist for this user):', e.message);
    }
    
    try {
      await prisma.priceList.deleteMany({ where: { masterId: userId } });
      console.log('[DELETE ACCOUNT] Deleted priceList');
    } catch(e) {
      console.log('[DELETE ACCOUNT] priceList error (may not exist for this user):', e.message);
    }
    
    try {
      await prisma.appointment.deleteMany({ where: { OR: [{ masterId: userId }, { clientId: userId }] } });
      console.log('[DELETE ACCOUNT] Deleted appointments');
    } catch(e) {
      console.log('[DELETE ACCOUNT] appointments error:', e.message);
    }
    
    try {
      await prisma.message.deleteMany({ where: { senderId: userId } });
      console.log('[DELETE ACCOUNT] Deleted messages from sender');
    } catch(e) {
      console.log('[DELETE ACCOUNT] messages error:', e.message);
    }
    
    // chats with roomId matching
    try {
      const userChats = await prisma.chat.findMany({ where: { roomId: { contains: userId } }});
      console.log('[DELETE ACCOUNT] Found user chats:', userChats.length);
      
      if (userChats.length > 0) {
        await prisma.message.deleteMany({ where: { chatId: { in: userChats.map(c => c.id) } }});
        console.log('[DELETE ACCOUNT] Deleted messages from chats');
        
        await prisma.chat.deleteMany({ where: { roomId: { contains: userId } } });
        console.log('[DELETE ACCOUNT] Deleted chats');
      }
    } catch(e) {
      console.log('[DELETE ACCOUNT] chats error:', e.message);
    }
    
    // Delete other related data
    try {
      await prisma.like.deleteMany({ where: { userId } });
      console.log('[DELETE ACCOUNT] Deleted likes');
    } catch(e) {
      console.log('[DELETE ACCOUNT] likes error:', e.message);
    }
    
    try {
      await prisma.favorite.deleteMany({ where: { clientId: userId } });
      console.log('[DELETE ACCOUNT] Deleted favorites');
    } catch(e) {
      console.log('[DELETE ACCOUNT] favorites error:', e.message);
    }
    
    try {
      await prisma.review.deleteMany({ where: { OR: [{ masterId: userId }, { clientId: userId }] } });
      console.log('[DELETE ACCOUNT] Deleted reviews');
    } catch(e) {
      console.log('[DELETE ACCOUNT] reviews error:', e.message);
    }
    
    try {
      await prisma.blacklist.deleteMany({ where: { OR: [{ masterId: userId }, { clientId: userId }] } });
      console.log('[DELETE ACCOUNT] Deleted blacklist entries');
    } catch(e) {
      console.log('[DELETE ACCOUNT] blacklist error:', e.message);
    }
    
    try {
      await prisma.blockedSlot.deleteMany({ where: { masterId: userId } });
      console.log('[DELETE ACCOUNT] Deleted blocked slots');
    } catch(e) {
      console.log('[DELETE ACCOUNT] blocked slots error:', e.message);
    }
    
    try {
      await prisma.galleryItem.deleteMany({ where: { masterId: userId } });
      console.log('[DELETE ACCOUNT] Deleted gallery items');
    } catch(e) {
      console.log('[DELETE ACCOUNT] gallery items error:', e.message);
    }
    
    try {
      await prisma.portfolio.deleteMany({ where: { masterId: userId } });
      console.log('[DELETE ACCOUNT] Deleted portfolio items');
    } catch(e) {
      console.log('[DELETE ACCOUNT] portfolio error:', e.message);
    }
    
    try {
      await prisma.paymentInfo.deleteMany({ where: { masterId: userId } });
      console.log('[DELETE ACCOUNT] Deleted payment info');
    } catch(e) {
      console.log('[DELETE ACCOUNT] payment info error:', e.message);
    }
    
    try {
      await prisma.pushToken.deleteMany({ where: { userId } });
      console.log('[DELETE ACCOUNT] Deleted push tokens');
    } catch(e) {
      console.log('[DELETE ACCOUNT] push tokens error:', e.message);
    }
    
    try {
      await prisma.telegramLink.deleteMany({ where: { userId } });
      console.log('[DELETE ACCOUNT] Deleted telegram links');
    } catch(e) {
      console.log('[DELETE ACCOUNT] telegram links error:', e.message);
    }
    
    try {
      await prisma.calendarSync.deleteMany({ where: { masterId: userId } });
      console.log('[DELETE ACCOUNT] Deleted calendar sync');
    } catch(e) {
      console.log('[DELETE ACCOUNT] calendar sync error:', e.message);
    }
    
    try {
      await prisma.subscription.deleteMany({ where: { masterId: userId } });
      console.log('[DELETE ACCOUNT] Deleted subscription');
    } catch(e) {
      console.log('[DELETE ACCOUNT] subscription error:', e.message);
    }
    
    try {
      await prisma.referralCode.deleteMany({ where: { clientId: userId } });
      console.log('[DELETE ACCOUNT] Deleted referral codes');
    } catch(e) {
      console.log('[DELETE ACCOUNT] referral codes error:', e.message);
    }
    
    try {
      await prisma.referralUse.deleteMany({ where: { referredClientId: userId } });
      console.log('[DELETE ACCOUNT] Deleted referral uses');
    } catch(e) {
      console.log('[DELETE ACCOUNT] referral uses error:', e.message);
    }
    
    try {
      await prisma.connectionCode.deleteMany({ where: { userId } });
      console.log('[DELETE ACCOUNT] Deleted connection codes');
    } catch(e) {
      console.log('[DELETE ACCOUNT] connection codes error:', e.message);
    }
    
    try {
      await prisma.user.delete({ where: { id: userId } });
      console.log('[DELETE ACCOUNT] Deleted user');
    } catch(e) {
      console.error('[DELETE ACCOUNT] Failed to delete user:', e);
      throw e;
    }
    
    res.json({ success: true });
  } catch(e: any) {
    console.error('[DELETE ACCOUNT] Error:', e);
    res.status(500).json({ error: 'Помилка видалення акаунта: ' + (e.message || 'Невідома помилка') });
  }
});

export default router;
