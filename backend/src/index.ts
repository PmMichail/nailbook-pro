import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import masterRoutes from './routes/master';
import clientRoutes from './routes/client';
import chatRoutes from './routes/chats';
import uploadRoutes from './routes/upload';
import galleryRoutes from './routes/gallery';
import favoritesRoutes from './routes/favorites';
import paymentRoutes from './routes/payment';
import telegramRoutes from './routes/telegram';
import notificationsRoutes from './routes/notifications';
import calendarRoutes from './routes/calendar';
import statisticsRoutes from './routes/statistics';
import subscriptionRoutes from './routes/subscription';
import webhookRoutes from './routes/webhooks';
import adminRoutes from './routes/admin';
import { createServer } from 'http';
import { initSocket, getIo, getSocketId } from './socket/index';
import path from 'path';
import prisma from './models/prismaClient';
import { sendTelegramMessage } from './services/telegram';
import { sendPushNotification } from './services/firebase';

dotenv.config();

import userRoutes from './routes/user';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/master/payment', paymentRoutes); 
app.use('/api/telegram', telegramRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/master/statistics', statisticsRoutes);
app.use('/api/master/subscription', subscriptionRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);

const server = createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Auto-cancellation worker for unpaid prepayments
setInterval(async () => {
  try {
    const expiredApps = await prisma.appointment.findMany({
      where: {
        status: 'AWAITING_PREPAYMENT',
        prepaymentDeadline: { lt: new Date() }
      },
      include: {
        client: { include: { pushToken: true } },
        master: { include: { pushToken: true } }
      }
    });

    for (const app of expiredApps) {
      // Маркуємо як CANCELLED
      await prisma.appointment.update({
        where: { id: app.id },
        data: { status: 'CANCELLED' }
      });

      const cancelMsg = `Ваш запис на ${app.date.toISOString().split('T')[0]} о ${app.time} автоматично скасовано через відсутність передоплати.`;
      const masterMsg = `Запис клієнта ${app.client?.name || ''} на ${app.date.toISOString().split('T')[0]} о ${app.time} автоматично скасовано (час на передоплату вийшов).`;

      // Повідомлення клієнту
      sendTelegramMessage(app.clientId, cancelMsg);
      if (app.client?.pushToken?.token) {
        await sendPushNotification(app.client.pushToken.token, 'Запис скасовано', cancelMsg);
      }
      const clientSocket = getSocketId(app.clientId);
      if (clientSocket) getIo().to(clientSocket).emit('appointment_cancelled_auto', { id: app.id });

      // Повідомлення майстру
      sendTelegramMessage(app.masterId, masterMsg);
      if (app.master?.pushToken?.token) {
        await sendPushNotification(app.master.pushToken.token, 'Запис скасовано', masterMsg);
      }
      const masterSocket = getSocketId(app.masterId);
      if (masterSocket) getIo().to(masterSocket).emit('appointment_cancelled_auto', { id: app.id });
    }
  } catch (err) {
    console.error('Error in prepayment expiration worker:', err);
  }
}, 5 * 60 * 1000); // Check every 5 minutes
