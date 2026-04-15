import cron from 'node-cron';
import prisma from '../models/prismaClient';
import { sendPushNotification } from './firebase';
import { sendTelegramMessage } from './telegram';

export const startCronJobs = () => {
  // Check every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date();
      // Boundaries
      const in24hStart = new Date(now.getTime() + 24 * 60 * 60 * 1000 - 15 * 60 * 1000);
      const in24hEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 15 * 60 * 1000);
      
      const in2hStart = new Date(now.getTime() + 2 * 60 * 60 * 1000 - 15 * 60 * 1000);
      const in2hEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000);

      // fetch CONFIRMED apps upcoming
      const upcomingApps = await prisma.appointment.findMany({
        where: {
           status: 'CONFIRMED',
        },
        include: {
           client: { include: { pushToken: true } },
           master: { include: { pushToken: true } }
        }
      });

      for (let app of upcomingApps) {
         const appTimeStr = app.time.split(':');
         const appDate = new Date(app.date);
         appDate.setHours(parseInt(appTimeStr[0], 10), parseInt(appTimeStr[1], 10));

         const sent = (app.remindersSent as any) || {};
         let updateRequired = false;

         // Check 24 hours
         if (appDate >= in24hStart && appDate <= in24hEnd && !sent['24h']) {
             if (app.client.pushToken) {
                 await sendPushNotification(app.client.pushToken.token, 'Нагадування про запис', `Ваш запис до майстра ${app.master.name} завтра о ${app.time}`);
             } else {
                 await sendTelegramMessage(app.clientId, `⏳ Нагадування: Ваш запис до майстра ${app.master.name} завтра о ${app.time}`);
             }
             if (app.master.pushToken) {
                 await sendPushNotification(app.master.pushToken.token, 'Нагадування про клієнта', `У вас запис завтра о ${app.time} (клієнт: ${app.client.name})`);
             } else {
                 await sendTelegramMessage(app.masterId, `⏳ Нагадування: У вас запис завтра о ${app.time} (клієнт: ${app.client.name})`);
             }
             sent['24h'] = true;
             updateRequired = true;
         }

         // Check 2 hours
         if (appDate >= in2hStart && appDate <= in2hEnd && !sent['2h']) {
             if (app.client.pushToken) {
                 await sendPushNotification(app.client.pushToken.token, 'Скоро Ваш запис!', `Чекаємо на Вас сьогодні о ${app.time}.`);
             } else {
                 await sendTelegramMessage(app.clientId, `⚠️ Скоро Ваш запис! Чекаємо на Вас сьогодні о ${app.time}.`);
             }
             if (app.master.pushToken) {
                 await sendPushNotification(app.master.pushToken.token, 'Наступний клієнт!', `Запис сьогодні о ${app.time} (клієнт: ${app.client.name})`);
             } else {
                 await sendTelegramMessage(app.masterId, `⚠️ Наступний клієнт! Запис сьогодні о ${app.time} (клієнт: ${app.client.name})`);
             }
             sent['2h'] = true;
             updateRequired = true;
         }
         
         if (updateRequired) {
             await prisma.appointment.update({
                 where: { id: app.id },
                 data: { remindersSent: sent }
             });
         }
      }
    } catch(e) {
      console.error('Cron error', e);
    }
  });
  console.log('Cron jobs started (checking reminders every 15 minutes)');
};
