import { Router } from 'express';
import prisma from '../models/prismaClient';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Отримати всі чати поточного користувача
router.get('/', async (req: AuthRequest, res) => {
  try {
    const isMaster = req.user!.role === 'MASTER';
    
    const userAppointments = await prisma.appointment.findMany({
        where: { OR: [{ masterId: req.user!.id }, { clientId: req.user!.id }] },
        select: { id: true }
    });
    const appointmentIds = userAppointments.map(a => a.id);

    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { roomId: { contains: req.user!.id } },
          { roomId: { in: appointmentIds } }
        ]
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enrichedChats = await Promise.all(chats.map(async (chat) => {
      let otherUser = null;
      if (chat.roomId && chat.roomId.includes('_')) {
         const ids = chat.roomId.split('_');
         const otherId = ids.find(id => id !== req.user!.id);
         if (otherId) {
            otherUser = await prisma.user.findUnique({
               where: { id: otherId },
               select: { id: true, name: true, phone: true, avatarUrl: true, salonName: true }
            });
         }
      } else if (chat.roomId && chat.roomId.startsWith('direct-')) {
         const stripped = chat.roomId.replace('direct-', '');
         let otherId = null;
         if (stripped.includes(req.user!.id)) {
             otherId = stripped.replace(req.user!.id, '').replace(/^-|-$/g, '');
         }
         if (otherId && otherId !== 'null' && otherId.length > 5) {
             otherUser = await prisma.user.findUnique({ 
                 where: { id: otherId }, 
                 select: { id: true, name: true, phone: true, avatarUrl: true, salonName: true } 
             });
         }
      } else if (chat.roomId) {
         // It might be an appointment chat
         const appointment = await prisma.appointment.findUnique({
             where: { id: chat.roomId },
             include: { client: { select: { id: true, name: true, phone: true, avatarUrl: true, salonName: true } }, 
                        master: { select: { id: true, name: true, phone: true, avatarUrl: true, salonName: true } } }
         });
         if (appointment) {
             if (req.user!.role === 'MASTER') otherUser = appointment.client;
             else otherUser = appointment.master;
         }
      }
      return { ...chat, otherUser };
    }));

    res.json(enrichedChats);
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Отримати історію повідомлень конкретного чату (по roomId)
router.get('/:roomId/messages', async (req: AuthRequest, res) => {
  try {
    const chat = await prisma.chat.findUnique({
      where: { roomId: req.params.roomId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, name: true, role: true } } }
        }
      }
    });

    if (!chat) {
      return res.json([]);
    }
    
    res.json(chat.messages);
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Додати нове повідомлення (резервний метод, основний через сокети)
router.post('/:roomId/messages', async (req: AuthRequest, res) => {
  try {
    const { text, imageUrl } = req.body;
    let chat = await prisma.chat.findUnique({
      where: { roomId: req.params.roomId }
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: { roomId: req.params.roomId }
      });
    }

    const message = await prisma.message.create({
      data: {
        chatId: chat.id,
        senderId: req.user!.id,
        text,
        imageUrl,
        isRead: false
      }
    });

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Позначити всі повідомлення в чаті як прочитані
router.put('/:id/read', async (req: AuthRequest, res) => {
  try {
    await prisma.message.updateMany({
      where: {
        chatId: req.params.id,
        senderId: { not: req.user!.id },
        isRead: false
      },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

export default router;
