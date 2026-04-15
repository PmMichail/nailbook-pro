import { Expo } from 'expo-server-sdk';
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin Initialized');
} else {
  console.warn('Firebase service account not found at: ', serviceAccountPath);
}

const expo = new Expo();

export const sendPushNotification = async (token: string, title: string, body: string, data: any = {}) => {
  console.log('[PUSH SEND] Token:', token);
  console.log('[PUSH SEND] Title:', title);
  console.log('[PUSH SEND] Body:', body);

  if (!token) return false;

  // Handle Expo Push Tokens gracefully
  if (token.startsWith('ExponentPushToken[') || Expo.isExpoPushToken(token)) {
      try {
          const receipts = await expo.sendPushNotificationsAsync([{
              to: token,
              sound: 'default',
              title,
              body,
              data
          }]);
          console.log('[PUSH SEND] Expo Success:', receipts);
          return true;
      } catch (e) {
          console.error('[PUSH SEND] Expo Error:', e);
          return false;
      }
  }

  // Handle Raw FCM Tokens
  if (!admin.apps.length) return false;
  
  const stringifiedData: any = {};
  for(const k in data) {
    stringifiedData[k] = String(data[k]);
  }

  try {
    const message = {
      notification: { title, body },
      data: stringifiedData,
      token: token,
    };
    const response = await admin.messaging().send(message);
    console.log('[PUSH DEBUG] FCM Success:', response);
    return true;
  } catch (error) {
    console.error('[PUSH DEBUG] FCM Error:', error);
    return false;
  }
};
