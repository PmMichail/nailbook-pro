import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { useTheme } from '../context/ThemeContext';

export const RegisterScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'MASTER'|'CLIENT'>('CLIENT');

  const [inviteCode, setInviteCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const { colors, isDark } = useTheme();

  const handleRegister = async () => {
    try {
      if (!name || !phone || !password) {
        Alert.alert('Помилка', 'Заповніть всі поля');
        return;
      }
      
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      const payload: any = { name, phone, password, role };
      if (role === 'CLIENT') {
         if (inviteCode) payload.inviteCode = inviteCode.trim();
         if (referralCode) payload.referralCode = referralCode.trim();
      }

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (!response.ok) {
        Alert.alert('Помилка', data.error || 'Щось пішло не так');
        return;
      }

      console.log('Registered successfully');
      const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      // Attempt to register push notifications
      registerForPushNotificationsAsync().then(async (pushToken) => {
         if (pushToken) {
           try {
             console.log('[PUSH] 7. Sending token to server...');
             const pushResponse = await fetch(`${API_URL}/api/client/push-token`, {
               method: 'POST',
               headers: { 
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${data.token}`
               },
               body: JSON.stringify({ token: pushToken, os: Platform.OS })
             });
             const pushJson = await pushResponse.json();
             console.log('[PUSH] 8. Server response:', pushJson);
           } catch(e) {
             console.error('[PUSH] 8b. Server Error:', e);
           }
         }
      });

      Alert.alert('Успіх', 'Акаунт успішно створено!', [
        { text: 'OK', onPress: () => {
             if (data.user.role === 'MASTER') {
               navigation.replace('MasterTabs');
             } else {
               navigation.replace('ClientTabs');
             }
        }}
      ]);
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
      <Text style={[styles.title, { color: colors.text }]}>{t('register_title')}</Text>
      
      <View style={styles.roleContainer}>
        <TouchableOpacity 
          style={[styles.roleButton, { backgroundColor: colors.card, borderColor: colors.border }, role === 'CLIENT' && styles.roleButtonActive]} 
          onPress={() => setRole('CLIENT')}
        >
          <Text style={[styles.roleText, role === 'CLIENT' && styles.roleTextActive]}>{t('role_client')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.roleButton, { backgroundColor: colors.card, borderColor: colors.border }, role === 'MASTER' && styles.roleButtonActive]} 
          onPress={() => setRole('MASTER')}
        >
          <Text style={[styles.roleText, role === 'MASTER' && styles.roleTextActive]}>{t('role_master')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput 
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder={t('name')}
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />
        <TextInput 
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder={t('phone')}
          placeholderTextColor={colors.textSecondary}
          value={phone}
          onChangeText={(text) => {
            let cleaned = text;
            if (!cleaned.startsWith('+') && cleaned.startsWith('0')) {
               cleaned = '+38' + cleaned;
            }
            let digits = cleaned.replace(/\D/g, '');
            if (digits.startsWith('380') && digits.length > 3) {
               let formatted = '+38 0' + digits.substring(3, 5);
               if (digits.length > 5) formatted += ' ' + digits.substring(5, 8);
               if (digits.length > 8) formatted += ' ' + digits.substring(8, 10);
               if (digits.length > 10) formatted += ' ' + digits.substring(10, 12);
               cleaned = formatted;
            }
            setPhone(cleaned);
          }}
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
        {role === 'CLIENT' && (
          <>
            <TextInput 
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Код майстра (необов'язково)"
              placeholderTextColor={colors.textSecondary}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
            />
            <TextInput 
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="ПРОМОКОД на знижку 10% (опц.)"
              placeholderTextColor={colors.textSecondary}
              value={referralCode}
              onChangeText={setReferralCode}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </>
        )}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
        <Text style={styles.primaryButtonText}>{t('register_btn')}</Text>
      </TouchableOpacity>
      
      <Text style={{textAlign: 'center', fontSize: 11, color: colors.textSecondary, marginBottom: 15}}>
          Натискаючи кнопку, ви погоджуєтесь з нашою{'\n'}
          <Text style={{color: colors.primary, textDecorationLine: 'underline'}} onPress={() => navigation.navigate('TermsScreen')}>Публічною Офертою</Text>
      </Text>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.secondaryButtonText}>{t('login_btn')}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    width: '100%',
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFB6C1',
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  roleButtonActive: {
    backgroundColor: '#FF69B4',
    borderColor: '#FF69B4',
  },
  roleText: {
    color: '#FF69B4',
    fontWeight: 'bold',
  },
  roleTextActive: {
    color: '#fff',
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
    backgroundColor: '#FF69B4',
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
