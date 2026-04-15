import { Router } from 'express';
import { google } from 'googleapis';
import prisma from '../models/prismaClient';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
  process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/callback'
);

// Отримати URL для авторизації Google Calendar
router.get('/auth', authenticate, (req: AuthRequest, res) => {
  if (req.user!.role !== 'MASTER') return res.status(403).json({ error: 'Тільки для майстрів' });
  
  const scopes = ['https://www.googleapis.com/auth/calendar.events'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: req.user!.id // Передаємо ID майстра, щоб після callback знати кому зберегти токен
  });
  
  res.json({ url });
});

// Callback після підтвердження авторизації (виклик від Google)
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).send('Invalid request');
    }

    const { tokens } = await oauth2Client.getToken(code as string);
    const masterId = state as string;

    await prisma.calendarSync.upsert({
      where: { masterId },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date as any,
        isEnabled: true
      },
      create: {
        masterId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date as any,
        isEnabled: true
      }
    });

    res.send('Google Calendar успішно підключено! Ви можете повернутися в додаток.');
  } catch (error) {
    res.status(500).send('Помилка підключення Google Calendar.');
  }
});

// Синхронізувати (додати запис до календаря) - цей метод буде викликатись при ствренні Appointment
export const syncAppointmentToCalendar = async (masterId: string, appointmentInfo: any) => {
  try {
    const syncInfo = await prisma.calendarSync.findUnique({ where: { masterId } });
    if (!syncInfo || !syncInfo.isEnabled || !syncInfo.refreshToken) return;

    oauth2Client.setCredentials({
      access_token: syncInfo.accessToken,
      refresh_token: syncInfo.refreshToken,
      expiry_date: Number(syncInfo.expiryDate)
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `Манікюр: ${appointmentInfo.clientName}`,
        description: `Послуга: ${appointmentInfo.serviceName}`,
        start: { dateTime: appointmentInfo.startTime.toISOString() },
        end: { dateTime: appointmentInfo.endTime.toISOString() },
      }
    });
  } catch (error) {
    console.error('Calendar Sync Error', error);
  }
};

router.delete('/disconnect', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.calendarSync.delete({ where: { masterId: req.user!.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Помилка відключення' });
  }
});

export default router;
