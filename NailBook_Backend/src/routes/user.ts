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

export default router;
