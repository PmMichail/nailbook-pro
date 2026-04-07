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
import { createServer } from 'http';
import { initSocket } from './socket/index';
import path from 'path';

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

const server = createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
