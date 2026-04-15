import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync() {
  console.log('[PUSH] 1. Starting push registration...');
  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    console.log('[PUSH] 2. Existing permission status:', existingStatus);

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('[PUSH] 3. Requested permission, new status:', finalStatus);
    }
    
    if (finalStatus !== 'granted') {
      console.log('[PUSH] 4. Permission denied!');
      return null;
    }

    console.log('[PUSH] 5. Getting Expo push token...');
    try {
       const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
       
       if (!projectId) {
           console.warn('[PUSH DEBUG] ProjectId is missing in app.json. Please run "eas init" in the frontend folder.');
       }

       const expoResp = await Notifications.getExpoPushTokenAsync({ projectId });
       token = expoResp.data;
       console.log('[PUSH] 6. Got token:', token);
    } catch (e) {
       console.log('[PUSH] 6b. getExpoPushTokenAsync failed. Attempting raw FCM push token...', e);
       try {
           const pushTokenResp = await Notifications.getDevicePushTokenAsync();
           token = pushTokenResp.data;
           console.log('[PUSH] 6c. Successfully acquired Raw Device Token:', token);
       } catch (err) {
           console.log('[PUSH] 6d. Failed to get any push token', err);
       }
    }
  } catch (e) {
     console.log('[PUSH] Error obtaining Push Token globally:', e);
  }

  return token;
}
