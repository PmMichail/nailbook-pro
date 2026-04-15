import prisma from '../models/prismaClient';
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN || '';
let bot: TelegramBot | null = null;
if (token) {
    try {
        bot = new TelegramBot(token, { polling: true });

        bot.onText(/\/start (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const linkToken = match ? match[1] : null;
            
            if (linkToken) {
                try {
                    const user = await prisma.user.findFirst({
                       where: { id: linkToken }
                    });
                    if (user) {
                       await prisma.telegramLink.upsert({
                          where: { userId: user.id },
                          update: { chatId: String(chatId) },
                          create: { userId: user.id, chatId: String(chatId) }
                       });
                       bot?.sendMessage(chatId, `Вітаємо, ${user.name}! Ваш акаунт успішно підв'язано до Telegram. Ви будете отримувати сповіщення сюди.`);
                    } else {
                       bot?.sendMessage(chatId, `Помилка: користувача не знайдено.`);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        });
        
        bot.onText(/\/start$/, (msg) => {
           bot?.sendMessage(msg.chat.id, "Вітаємо в NailsBook Pro Bot! Будь ласка, перейдіть до бота за спеціальним посиланням з додатку.");
        });
    } catch(e) {
        console.error('Failed to init Telegram Bot:', e);
    }
}

export const sendTelegramMessage = async (userId: string, message: string) => {
  try {
     if (!bot) {
         console.log(`[TELEGRAM MOCK] To User: ${userId}, Message: ${message}`);
         return true;
     }

     const link = await prisma.telegramLink.findUnique({ where: { userId } });
     if (link && link.chatId) {
         await bot.sendMessage(link.chatId, message);
         return true;
     }
     
     console.log(`[TELEGRAM INFO] User ${userId} has no connected Telegram account.`);
     return false; // User has not linked Telegram
  } catch(e) {
     console.log('TG send err', e);
     return false;
  }
};

export const sendTelegramNotification = async (chatId: string, message: string) => {
  try {
     if (!bot) {
         console.log(`[TELEGRAM MOCK] To Chat: ${chatId}, Message: ${message}`);
         return true;
     }
     await bot.sendMessage(chatId, message);
     return true;
  } catch(e) {
     console.log('TG send err', e);
     return false;
  }
};

export const sendAppointmentNotification = async (userId: string, appointment: any, type: 'created' | 'confirmed' | 'cancelled') => {
  let msg = '';
  if (type === 'created') msg = `Новий запис! Дата: ${appointment.date}, Час: ${appointment.time}`;
  if (type === 'confirmed') msg = `Ваш запис на ${appointment.date} о ${appointment.time} ПІДТВЕРДЖЕНО.`;
  if (type === 'cancelled') msg = `Ваш запис на ${appointment.date} о ${appointment.time} СКАСОВАНО.`;
  
  return sendTelegramMessage(userId, msg);
};
