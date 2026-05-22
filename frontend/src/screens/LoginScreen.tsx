import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';

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
          promptMessage: t('auth.biometricPrompt'),
          fallbackLabel: t('auth.usePassword')
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
      Alert.alert(t('error'), t('auth.fillAllFields'));
      return;
    }
    executeLogin(phone, password);
  };

  const executeLogin = async (phoneToUse: string, passToUse: string) => {
    try {
      setIsAuthenticating(true);
      const API_URL = api.defaults.baseURL;
      
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneToUse, password: passToUse }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(t('error'), data.error || t('auth.genericError'));
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
             const pushController = new AbortController();
             const pushTimeoutId = setTimeout(() => pushController.abort(), 10000); // 10 second timeout
             
             await fetch(`${API_URL}/api/client/push-token`, {
               method: 'POST',
               headers: { 
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${data.token}`
               },
               body: JSON.stringify({ token: pushToken, os: Platform.OS }),
               signal: pushController.signal
             });
             
             clearTimeout(pushTimeoutId);
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
      
    } catch (error: any) {
      console.error(error);
      if (error.name === 'AbortError') {
        Alert.alert(t('error'), t('auth.connectionError') + ' (timeout)');
      } else {
        Alert.alert(t('error'), t('auth.connectionError'));
      }
      setIsAuthenticating(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.kicker}>NAILSBOOK PRO</Text>
        <Text style={[styles.title, { color: colors.text }]}>{t('login_title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Ваш beauty-кабінет для записів, клієнтів і преміум-сервісу.</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput 
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder={t('phone')}
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

      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={handleLogin} disabled={isAuthenticating}>
        {isAuthenticating ? (
           <ActivityIndicator color="#fff" />
        ) : (
           <Text style={styles.primaryButtonText}>{t('login_btn')}</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Register')}>
        <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{t('register_btn')}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  heroCard: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    marginBottom: 22,
    shadowColor: '#C88D7A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
  },
  kicker: {
    color: '#C88D7A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: { fontSize: 15, lineHeight: 22 },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#C88D7A', // Hot pink пастельний варіант
    width: '100%',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#C88D7A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 8,
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
    color: '#C88D7A',
    fontSize: 16,
    fontWeight: '600',
  }
});
