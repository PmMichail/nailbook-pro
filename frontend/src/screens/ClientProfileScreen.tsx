import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, TextInput, Alert, Image, Share, RefreshControl } from 'react-native';
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
  const [myMaster, setMyMaster] = useState<any>(null);

  const [referralCode, setReferralCode] = useState('');
  const [referralUses, setReferralUses] = useState(0);
  const [referralPendingBonuses, setReferralPendingBonuses] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    await loadProfile();
    await loadReferralStats();
  };

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

        if (u.masterId) {
            const masterRes = await api.get(`/api/client/master/${u.masterId}`);
            if (masterRes.data && masterRes.data.name) {
                setMyMaster(masterRes.data);
            }
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

  const onRefresh = useCallback(async () => {
      setRefreshing(true);
      await loadAll();
      setRefreshing(false);
  }, []);

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

      const token = await AsyncStorage.getItem('token');
      const fetchResponse = await fetch(`${api.defaults.baseURL}/api/user/profile`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
      });
      const res = { data: await fetchResponse.json() };
      
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

  const handleDeleteAccount = async () => {
    Alert.alert('УВАГА: НЕЗВОРОТНЯ ДІЯ', 'Ви точно хочете назавжди видалити свій акаунт?', [
      { text: 'Скасувати', style: 'cancel' },
      { text: 'ВИДАЛИТИ АКАУНТ', style: 'destructive', onPress: async () => {
          try {
            await api.delete('/api/user/profile');
            await handleLogout();
          } catch(e) { Alert.alert('Помилка', 'Не вдалося видалити'); }
      }}
    ]);
  };

  return (
    <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handlePickAvatar}>
          {avatar ? (
             <Image source={{uri: avatar}} style={styles.avatarImage} />
          ) : (
             <View style={[styles.avatarPlaceholder, {backgroundColor: colors.border}]} />
          )}
          <Text style={{textAlign: 'center', color: colors.textSecondary, marginTop: 5, fontSize: 12}}>Змінити фото</Text>
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
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveProfile}>
                <Text style={[styles.saveBtnText, { color: isDark ? '#000' : '#fff' }]}>Зберегти зміни</Text>
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Реферальна програма 🎁</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Запроси подругу - отримай знижку 10%!</Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 20, fontSize: 13 }}>Ваша подруга отримає знижку 10% на перший запис, а ви 10% — на ваш наступний запис за кожну подругу!</Text>
          
          <View style={{backgroundColor: colors.background, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 15}}>
             <Text style={{color: colors.text, fontWeight: 'bold', fontSize: 18, letterSpacing: 2, textAlign: 'center', marginBottom: 15}}>{referralCode || 'Завантаження...'}</Text>
             <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                 <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.primary }]} onPress={shareReferralCode}>
                     <Text style={{color: colors.primary, fontWeight: 'bold', fontSize: 12}}>Поділитися 💬</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.primary, marginLeft: 10 }]} onPress={copyReferralCode}>
                     <Text style={{color: colors.primary, fontWeight: 'bold', fontSize: 12}}>Копіювати</Text>
                 </TouchableOpacity>
             </View>
          </View>
          
          <View style={{flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 15}}>
             <View style={{alignItems: 'center', flex: 1}}>
                 <Text style={{fontSize: 24, fontFamily: 'serif', fontWeight: 'bold', color: colors.text}}>{referralUses}</Text>
                 <Text style={{fontSize: 12, color: colors.textSecondary}}>Запрошено</Text>
             </View>
             <View style={{alignItems: 'center', flex: 1, borderLeftWidth: 1, borderLeftColor: colors.border}}>
                 <Text style={{fontSize: 24, fontFamily: 'serif', fontWeight: 'bold', color: colors.primary}}>{referralPendingBonuses}</Text>
                 <Text style={{fontSize: 12, color: colors.textSecondary}}>Доступно знижок</Text>
             </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Мій Майстер</Text>
        
        {myMaster && (
           <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 15, paddingVertical: 15 }]}>
             <View style={{flexDirection: 'row', alignItems: 'center'}}>
                 <View style={{width: 60, height: 60, borderRadius: 30, backgroundColor: colors.border, marginRight: 15, overflow: 'hidden'}}>
                     {(myMaster.salonLogo || myMaster.avatarUrl) && <Image source={{uri: (myMaster.salonLogo || myMaster.avatarUrl).startsWith('http') ? (myMaster.salonLogo || myMaster.avatarUrl) : `${api.defaults.baseURL}/${(myMaster.salonLogo || myMaster.avatarUrl)}`}} style={{width: '100%', height: '100%'}} />}
                 </View>
                 <View style={{flex: 1}}>
                     <Text style={{ color: colors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Поточний майстер</Text>
                     <Text style={{ color: colors.text, fontFamily: 'serif', fontStyle: 'italic', fontSize: 24, fontWeight: 'bold' }}>{myMaster.name}</Text>
                     {myMaster.salonName && <Text style={{ color: colors.primary, fontSize: 16, marginTop: 4, fontWeight: 'bold' }}>💅 {myMaster.salonName}</Text>}
                     <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>{myMaster.phone}</Text>
                 </View>
             </View>
             <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, alignItems: 'center', width: '100%'}}>
                 <TouchableOpacity onPress={() => {
                     navigation.navigate('ChatScreen', { roomId: `direct-${myMaster.id}`, otherUser: myMaster });
                 }}>
                     <Text style={{color: colors.primary, fontSize: 14, fontWeight: 'bold'}}>💬 Написати</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => {
                     Alert.alert('Підтвердження', 'Відкріпитись від цього майстра?', [
                         {text: 'Ні', style: 'cancel'},
                         {text: 'Так', style: 'destructive', onPress: async () => {
                             try {
                                 await AsyncStorage.setItem('user', JSON.stringify({ ...JSON.parse(await AsyncStorage.getItem('user') || '{}'), masterId: null }));
                                 setMyMaster(null);
                                 await api.put('/api/client/unlink');
                             } catch(e) {}
                         }}
                     ]);
                 }}>
                     <Text style={{color: '#8b0000', fontSize: 13, fontWeight: 'bold'}}>Відкріпитись</Text>
                 </TouchableOpacity>
             </View>
           </View>
        )}
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 20 }]} onPress={() => navigation.navigate('SearchMastersScreen' as never)}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Знайти або підключити майстра 🔍</Text>
          <Text style={{ color: colors.textSecondary }}>Пошук за геолокацією або ввід коду</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Вподобання</Text>
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('Gallery' as never)}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Збережені дизайни (Обране)</Text>
          <Text style={{ color: colors.textSecondary }}>Переглянути збережені фото 💅</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Налаштування</Text>
        <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.settingText, { color: colors.text }]}>Темна тема</Text>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{true: colors.primary}} />
        </View>
        <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.settingText, { color: colors.text }]}>Push-сповіщення</Text>
          <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{true: colors.primary}} />
        </View>
        <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.settingText, { color: colors.text }]}>Telegram-бот</Text>
          <Switch value={telegramEnabled} onValueChange={setTelegramEnabled} trackColor={{true: colors.primary}} />
        </View>
      </View>

      <TouchableOpacity style={[styles.logoutButton, { borderColor: '#8b0000', backgroundColor: 'transparent', borderWidth: 1, marginBottom: 15 }]} onPress={handleLogout}>
        <Text style={[styles.logoutButtonText, { color: '#8b0000' }]}>Вийти з акаунту</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleDeleteAccount} style={{ alignSelf: 'center', marginBottom: 20 }}>
          <Text style={{color: '#ff0000', textDecorationLine: 'underline'}}>Видалити мій акаунт назавжди</Text>
      </TouchableOpacity>
      
      <View style={{height: 80}} />
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
  saveBtn: { padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  saveBtnText: { fontWeight: 'bold' },
  section: { padding: 20, paddingBottom: 0 },
  sectionTitle: { fontSize: 22, fontFamily: 'serif', fontStyle: 'italic', marginBottom: 15 },
  card: { padding: 20, borderRadius: 16, marginBottom: 10, borderWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  actionBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderWidth: 1, backgroundColor: 'transparent' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  settingText: { fontSize: 16 },
  logoutButton: { margin: 20, padding: 15, borderRadius: 12, alignItems: 'center' },
  logoutButtonText: { fontSize: 14, fontWeight: 'bold' }
});
