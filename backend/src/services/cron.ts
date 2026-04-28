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

  // Check once a day (e.g., at 10:00 AM) for Trial expirations
  cron.schedule('0 10 * * *', async () => {
     try {
         const now = new Date();
         const in48hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
         const in24hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
         
         const expiringTrials = await prisma.subscription.findMany({
             where: {
                 status: 'TRIAL',
                 trialEndsAt: {
                     gte: in24hours,
                     lte: in48hours
                 }
                 // We could add a field to track if reminder sent, but running once a day 
                 // and checking a 24h window (between 24h and 48h from now) ensures it fires exactly once per user.
             },
             include: { master: { include: { pushToken: true } } }
         });

         for (const sub of expiringTrials) {
             const msg = "Твій пробний період закінчується через 2 дні, не втрать доступ до бази клієнтів!";
             if (sub.master?.pushToken?.token) {
                 await sendPushNotification(sub.master.pushToken.token, 'Увага!', msg);
             } else {
                 await sendTelegramMessage(sub.masterId, '⚠️ ' + msg);
             }
         }
     } catch(e) {
         console.error('Trial Reminder Cron error', e);
     }
  });

  console.log('Cron jobs started (checking reminders every 15 minutes, trial check daily at 10:00)');
};
