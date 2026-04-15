import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../context/ThemeContext';

export const LoginScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    checkBiometricsAndAutoLogin();
  }, []);

  const checkBiometricsAndAutoLogin = async () => {
    try {
      if (Platform.OS === 'web') return;
      const savedPhone = await SecureStore.getItemAsync('user_phone');
      const savedPass = await SecureStore.getItemAsync('user_pass');
      
      if (!savedPhone || !savedPass) return; // No saved credentials, skip auto-login

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        setIsAuthenticating(true);
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Увійти за допомогою біометрії',
          fallbackLabel: 'Використати пароль'
        });
        
        if (result.success) {
          await executeLogin(savedPhone, savedPass);
        } else {
          setIsAuthenticating(false);
        }
      }
    } catch(e) {
      console.log('Biometrics failed', e);
      setIsAuthenticating(false);
    }
  };

  const handleLogin = () => {
    if (!phone || !password) {
      Alert.alert('Помилка', 'Заповніть всі поля');
      return;
    }
    executeLogin(phone, password);
  };

  const executeLogin = async (phoneToUse: string, passToUse: string) => {
    try {
      setIsAuthenticating(true);
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneToUse, password: passToUse }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Помилка', data.error || 'Щось пішло не так');
        setIsAuthenticating(false);
        return;
      }

      console.log('Login successfully:', data.user.id);
      
      // Save credentials for next biometric login
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('user_phone', phoneToUse);
        await SecureStore.setItemAsync('user_pass', passToUse);
      }

      const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      // Attempt to register push notifications
      registerForPushNotificationsAsync().then(async (pushToken) => {
         if (pushToken) {
           try {
             console.log('[PUSH] 7. Sending token to server...');
             await fetch(`${API_URL}/api/client/push-token`, {
               method: 'POST',
               headers: { 
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${data.token}`
               },
               body: JSON.stringify({ token: pushToken, os: Platform.OS })
             });
           } catch(e) {
             console.error('[PUSH] 8b. Server Error:', e);
           }
         }
      });
      
      setIsAuthenticating(false);
      // Navigate to appropriate tabs based on role
      if (data.user.role === 'ADMIN') {
        navigation.replace('AdminTabs');
      } else if (data.user.role === 'MASTER') {
        navigation.replace('MasterTabs');
      } else {
        navigation.replace('ClientTabs');
      }
      
    } catch (error) {
      console.error(error);
      Alert.alert('Помилка', 'Не вдалося з\'єднатися з сервером');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={[styles.title, { color: colors.text }]}>{t('login_title')}</Text>
      
      <View style={styles.inputContainer}>
        <TextInput 
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder="Номер телефону або Email"
          placeholderTextColor={colors.textSecondary}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput 
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder={t('password')}
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={isAuthenticating}>
        {isAuthenticating ? (
           <ActivityIndicator color="#fff" />
        ) : (
           <Text style={styles.primaryButtonText}>{t('login_btn')}</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.secondaryButtonText}>{t('register_btn')}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
     // Lavender blush / пастельно рожевий
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: '#FF69B4', // Hot pink пастельний варіант
    width: '100%',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FF69B4',
    fontSize: 16,
    fontWeight: '600',
  }
});
