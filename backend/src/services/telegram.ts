import prisma from '../models/prismaClient';

// Тимчасова заглушка для Telegram бота
export const sendTelegramMessage = async (userId: string, message: string) => {
  console.log(`[TELEGRAM MOCK] To User: ${userId}, Message: ${message}`);
  return true;
};

export const sendTelegramNotification = async (chatId: string, message: string) => {
  console.log(`[TELEGRAM MOCK] To Chat: ${chatId}, Message: ${message}`);
  return true;
};

export const sendAppointmentNotification = async (userId: string, appointment: any, type: 'created' | 'confirmed' | 'cancelled') => {
  console.log(`[TELEGRAM MOCK] Appointment ${type} for user ${userId}`);
  return true;
};
