import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';

export const RegisterScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'MASTER'|'CLIENT'>('CLIENT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [inviteCode, setInviteCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const { colors, isDark } = useTheme();

  const handleRegister = async () => {
    if (isSubmitting) return;
    try {
      if (!name || !phone || !password) {
        Alert.alert(t('error'), t('auth.fillAllFields'));
        return;
      }
      setIsSubmitting(true);
      
      const API_URL = api.defaults.baseURL;
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
        Alert.alert(t('error'), data.error || t('auth.genericError'));
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

      Alert.alert(t('success'), t('auth.accountCreated'), [
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
      Alert.alert(t('error'), t('auth.connectionError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.kicker}>JOIN NAILSBOOK</Text>
        <Text style={[styles.title, { color: colors.text }]}>{t('register_title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Створіть профіль клієнта або майстра за хвилину.</Text>
      </View>
      
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
              placeholder={t('auth.inviteCodePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
            />
            <TextInput 
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={t('auth.referralCodePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={referralCode}
              onChangeText={setReferralCode}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </>
        )}
      </View>

      <TouchableOpacity style={[styles.primaryButton, isSubmitting && styles.disabledButton]} onPress={handleRegister} disabled={isSubmitting}>
        <Text style={styles.primaryButtonText}>{isSubmitting ? t('auth.pleaseWait') : t('register_btn')}</Text>
      </TouchableOpacity>
      
      <Text style={{textAlign: 'center', fontSize: 11, color: colors.textSecondary, marginBottom: 15}}>
          {t('auth.acceptTermsPrefix')}{'\n'}
          <Text style={{color: colors.primary, textDecorationLine: 'underline'}} onPress={() => navigation.navigate('TermsScreen')}>{t('auth.publicOffer')}</Text>
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
    padding: 22,
  },
  heroCard: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    padding: 22,
    marginBottom: 18,
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
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '900',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: { fontSize: 15, lineHeight: 22 },
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
    borderColor: '#e0c0b4',
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  roleButtonActive: {
    backgroundColor: '#C88D7A',
    borderColor: '#C88D7A',
  },
  roleText: {
    color: '#C88D7A',
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
    backgroundColor: '#C88D7A',
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
  disabledButton: {
    opacity: 0.6,
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
