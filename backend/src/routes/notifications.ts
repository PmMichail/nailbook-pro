import { Router } from 'express';
import { Expo } from 'expo-server-sdk';
import prisma from '../models/prismaClient';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
let expo = new Expo();

// Зберегти токен девайсу для Push-сповіщень
router.post('/register-token', authenticate, async (req: AuthRequest, res) => {
  try {
    const { token, os } = req.body;

    if (!Expo.isExpoPushToken(token)) {
      return res.status(400).json({ error: 'Недійсний Push-токен Expo' });
    }

    await prisma.pushToken.upsert({
      where: { userId: req.user!.id },
      update: { token, os },
      create: { userId: req.user!.id, token, os }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Помилка збереження токену' });
  }
});

// Функція для надсилання сповіщення будь-якому юзеру (викликається внутрішньо з інших сервісів)
export const sendPushNotification = async (userId: string, title: string, body: string, data: any = {}) => {
  try {
    const pushToken = await prisma.pushToken.findUnique({ where: { userId } });
    if (!pushToken || !Expo.isExpoPushToken(pushToken.token)) {
      return; 
    }

    const messages = [{
      to: pushToken.token,
      sound: 'default' as any,
      title,
      body,
      data
    }];

    const chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (error) {
    console.error('Error sending push notification', error);
  }
};

export default router;
