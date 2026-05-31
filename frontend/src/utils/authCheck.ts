import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const checkAuth = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('token');
    const user = await AsyncStorage.getItem('user');
    return !!token && !!user;
  } catch {
    return false;
  }
};

export const requireAuth = async (navigation: any, action: string = 'Для цієї функції необхідно увійти або зареєструватися') => {
  const isAuthenticated = await checkAuth();
  
  if (!isAuthenticated) {
    Alert.alert(
      'Потрібна авторизація',
      action,
      [
        { text: 'Скасувати', style: 'cancel' },
        { 
          text: 'Увійти', 
          onPress: () => navigation.replace('Login')
        }
      ]
    );
    return false;
  }
  
  return true;
};
