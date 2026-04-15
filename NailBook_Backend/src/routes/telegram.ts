import { Router } from 'express';
import TelegramBot from 'node-telegram-bot-api';
import prisma from '../models/prismaClient';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Ініціалізація Telegram бота
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export let bot: TelegramBot | null = null;

try {
  bot = TELEGRAM_TOKEN ? new TelegramBot(TELEGRAM_TOKEN, { polling: true }) : null;
  if (bot) {
    bot.on('polling_error', (error) => {
      console.log('[TELEGRAM] Помилка підключення (polling_error):', error.message);
    });
  }
} catch (error: any) {
  console.log('[TELEGRAM] Бот тимчасово вимкнено через помилку:', error.message);
  bot = null;
}

// Обробник старту бота
if (bot) {
  bot.onText(/\/start (.+)/, async (msg, match) => {
    const chatId = msg.chat.id.toString();
    const token = match?.[1];

    if (!token) return;

    try {
      // Find token in temporary cache or directly mapped
      // For MVP, if token is valid user ID:
      const existingUser = await prisma.user.findUnique({ where: { id: token } });
      if (existingUser) {
        await prisma.telegramLink.upsert({
          where: { userId: existingUser.id },
          update: { chatId, username: msg.chat.username },
          create: { userId: existingUser.id, chatId, username: msg.chat.username }
        });
        
        bot.sendMessage(chatId, `Вітаємо, ${existingUser.name}! Ваш акаунт NailsBook успішно прив'язано до Telegram. Тепер ви будете отримувати тут сповіщення.`);
      }
    } catch (error) {
      console.error('Telegram Link Error', error);
    }
  });
}

// Прив'язка з додатку (повертає унікальне посилання для переходу в бот)
router.post('/link', authenticate, async (req: AuthRequest, res) => {
  try {
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'nailbook_bot';
    const link = `https://t.me/${botUsername}?start=${req.user!.id}`;
    res.json({ link });
  } catch (error) {
    res.status(500).json({ error: 'Помилка' });
  }
});

export const sendTelegramMessage = async (userId: string, message: string) => {
  if (!bot) return;
  try {
    const link = await prisma.telegramLink.findUnique({ where: { userId } });
    if (link && link.notifEnabled) {
      await bot.sendMessage(link.chatId, message);
    }
  } catch (error) {
    console.error('Failed to send telegram message to user:', userId, error);
  }
};

export default router;
