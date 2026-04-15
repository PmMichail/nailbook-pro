import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, TextInput, Alert, Image, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';

export const ClientProfileScreen = ({ navigation }: any) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);

  const [referralCode, setReferralCode] = useState('');
  const [referralUses, setReferralUses] = useState(0);
  const [referralPendingBonuses, setReferralPendingBonuses] = useState(0);

  useEffect(() => {
    loadProfile();
    loadReferralStats();
  }, []);

  const loadProfile = async () => {
    try {
      const uStr = await AsyncStorage.getItem('user');
      if (uStr) {
        const u = JSON.parse(uStr);
        setName(u.name || '');
        setPhone(u.phone || '');
        if (u.avatarUrl) {
          const formattedUrl = u.avatarUrl.startsWith('http') ? u.avatarUrl : `${api.defaults.baseURL}/${u.avatarUrl}`;
          setAvatar(formattedUrl);
        }
      }
    } catch(e) {}
  };

  const loadReferralStats = async () => {
    try {
      const resCode = await api.get('/api/client/referral-code');
      if (resCode.data?.code) {
        setReferralCode(resCode.data.code);
      }
      
      const resStats = await api.get('/api/client/referral-stats');
      if (resStats.data) {
        setReferralUses(resStats.data.uses || 0);
        setReferralPendingBonuses(resStats.data.pendingBonuses || 0);
      }
    } catch(e) {
      console.log('Failed to load referral stats', e);
    }
  };

  const copyReferralCode = async () => {
    if (referralCode) {
      await Clipboard.setStringAsync(referralCode);
      Alert.alert('Успіх', 'Код скопійовано в буфер обміну!');
    }
  };

  const shareReferralCode = async () => {
    if (!referralCode) return;
    try {
      await Share.share({
        message: `Привіт! Я записуюсь до майстра манікюру через зручний додаток NailsBook Pro. 💅\n\nВикористай мій промокод: ${referralCode}\nпри реєстрації та отримай знижку 10% на свій перший запис!`,
      });
    } catch (error: any) {
      Alert.alert('Помилка', error.message);
    }
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      
      if (avatar && !avatar.startsWith('http')) {
        const ext = avatar.split('.').pop() || 'jpg';
        formData.append('avatar', {
          uri: avatar,
          name: `avatar-${Date.now()}.${ext}`,
          type: `image/${ext}`
        } as any);
      }

      const res = await api.put('/api/user/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Update local storage
      await AsyncStorage.setItem('user', JSON.stringify(res.data));
      Alert.alert('Успіх', 'Профіль оновлено');
      loadProfile();
    } catch(e) {
      Alert.alert('Помилка', 'Не вдалося зберегти профіль');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handlePickAvatar}>
          {avatar ? (
             <Image source={{uri: avatar}} style={styles.avatarImage} />
          ) : (
             <View style={[styles.avatarPlaceholder, {backgroundColor: colors.border}]} />
          )}
          <Text style={{textAlign: 'center', color: colors.primary, marginTop: 5}}>Змінити</Text>
        </TouchableOpacity>
        
        <View style={styles.editForm}>
            <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border}]} value={name} onChangeText={setName} placeholder="Ім'я" placeholderTextColor={colors.textSecondary} />
            <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border}]} value={phone} onChangeText={(text) => {
                let cleaned = text;
                if (!cleaned.startsWith('+') && cleaned.startsWith('0')) { cleaned = '+38' + cleaned; }
                let digits = cleaned.replace(/\D/g, '');
                if (digits.startsWith('380') && digits.length > 3) {
                   let formatted = '+38 0' + digits.substring(3, 5);
                   if (digits.length > 5) formatted += ' ' + digits.substring(5, 8);
                   if (digits.length > 8) formatted += ' ' + digits.substring(8, 10);
                   if (digits.length > 10) formatted += ' ' + digits.substring(10, 12);
                   cleaned = formatted;
                }
                setPhone(cleaned);
            }} placeholder="Телефон" placeholderTextColor={colors.textSecondary} keyboardType="phone-pad" />
            <TouchableOpacity style={[styles.saveBtn, {backgroundColor: colors.primary}]} onPress={handleSaveProfile}>
                <Text style={styles.saveBtnText}>Зберегти зміни</Text>
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Реферальна програма 🎁</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 10 }]}>Запроси подругу - отримай знижку 10%!</Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 15 }}>Ваша подруга отримає знижку 10% на перший запис, а ви 10% — на ваш наступний запис за кожну подругу!</Text>
          
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: colors.primary + '50'}}>
             <Text style={{color: colors.primary, fontWeight: 'bold', fontSize: 18, letterSpacing: 1}}>{referralCode || 'Завантаження...'}</Text>
             <View style={{flexDirection: 'row', alignItems: 'center'}}>
                 <TouchableOpacity style={{backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8}} onPress={shareReferralCode}>
                     <Text style={{color: '#fff', fontWeight: 'bold'}}>Поділитися 💬</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={{backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8}} onPress={copyReferralCode}>
                     <Text style={{color: '#fff', fontWeight: 'bold'}}>Копіювати</Text>
                 </TouchableOpacity>
             </View>
          </View>
          
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 15}}>
             <View style={{alignItems: 'center'}}>
                 <Text style={{fontSize: 24, fontWeight: 'bold', color: colors.text}}>{referralUses}</Text>
                 <Text style={{fontSize: 12, color: colors.textSecondary}}>Запрошено</Text>
             </View>
             <View style={{alignItems: 'center'}}>
                 <Text style={{fontSize: 24, fontWeight: 'bold', color: '#4CAF50'}}>{referralPendingBonuses}</Text>
                 <Text style={{fontSize: 12, color: colors.textSecondary}}>Доступно знижок</Text>
             </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Мій Майстер</Text>
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, marginBottom: 20 }]} onPress={() => navigation.navigate('SearchMastersScreen' as never)}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Знайти або підключити майстра 🔍</Text>
          <Text style={{ color: colors.textSecondary }}>Пошук за геолокацією або ввід коду</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Мої записи</Text>
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Gallery' as never)}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Збережені дизайни (Обране)</Text>
          <Text style={{ color: colors.textSecondary }}>Переглянути збережені фото 💅</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Налаштування</Text>
        <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
          <Text style={[styles.settingText, { color: colors.text }]}>Темна тема</Text>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{true: colors.primary}} />
        </View>
        <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
          <Text style={[styles.settingText, { color: colors.text }]}>Push-сповіщення</Text>
          <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{true: colors.primary}} />
        </View>
        <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
          <Text style={[styles.settingText, { color: colors.text }]}>Telegram-бот</Text>
          <Switch value={telegramEnabled} onValueChange={setTelegramEnabled} trackColor={{true: colors.primary}} />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Вийти з акаунту</Text>
      </TouchableOpacity>
      
      <View style={{height: 50}} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 30, alignItems: 'center', borderBottomWidth: 1 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, marginBottom: 5 },
  avatarImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 5 },
  editForm: { width: '100%', marginTop: 20 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 16 },
  saveBtn: { padding: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FF69B4', marginBottom: 15 },
  card: { padding: 15, borderRadius: 15, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10 },
  settingText: { fontSize: 16 },
  logoutButton: { margin: 20, backgroundColor: '#FFB6C1', padding: 15, borderRadius: 20, alignItems: 'center' },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
