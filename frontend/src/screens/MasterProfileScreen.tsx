import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, TextInput, Alert, Image, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';

export const MasterProfileScreen = ({ navigation }: any) => {
  const { colors, isDark, toggleTheme } = useTheme();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [salonName, setSalonName] = useState('');
  const [salonLogo, setSalonLogo] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [facebook, setFacebook] = useState('');
  
  const [pushEnabled, setPushEnabled] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(false);

  const [subData, setSubData] = useState<any>(null);
  const [activeClients, setActiveClients] = useState(0);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const uStr = await AsyncStorage.getItem('user');
      if (uStr) {
        const u = JSON.parse(uStr);
        setUserId(u.id || '');
        setName(u.name || '');
        setPhone(u.phone || '');
        setSalonName(u.salonName || '');
        setAddress(u.address || '');
        setInstagram(u.instagram || '');
        setTiktok(u.tiktok || '');
        setFacebook(u.facebook || '');
        
        if (u.avatarUrl) {
          const formattedUrl = u.avatarUrl.startsWith('http') ? u.avatarUrl : `${api.defaults.baseURL}/${u.avatarUrl}`;
          setAvatar(formattedUrl);
        }
        if (u.salonLogo) {
          const formattedLogo = u.salonLogo.startsWith('http') ? u.salonLogo : `${api.defaults.baseURL}/${u.salonLogo}`;
        }
      }
      
      const subRes = await api.get('/api/master/subscription');
      if (subRes.data) {
        setSubData(subRes.data.subscription);
        setActiveClients(subRes.data.activeClientsCount);
      }
    } catch(e) {}
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

  const handlePickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSalonLogo(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      if (password) {
        formData.append('password', password);
      }
      
      if (avatar && !avatar.startsWith('http')) {
        const ext = avatar.split('.').pop() || 'jpg';
        formData.append('avatar', {
          uri: avatar,
          name: `avatar-${Date.now()}.${ext}`,
          type: `image/${ext}`
        } as any);
      }
      
      if (salonLogo && !salonLogo.startsWith('http')) {
        const ext = salonLogo.split('.').pop() || 'jpg';
        formData.append('salonLogo', {
          uri: salonLogo,
          name: `logo-${Date.now()}.${ext}`,
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

      // Social networks are saved via salon-info route separately or we can just send them together 
      // Wait, /api/master/salon-info is where we put instagram, tiktok, facebook
      await api.put('/api/master/salon-info', {
         instagram, tiktok, facebook
      });
      
      const newUStr = await AsyncStorage.getItem('user') || '{}';
      const parsedU = JSON.parse(newUStr);
      const combinedProfile = { ...parsedU, ...res.data, instagram, tiktok, facebook };
      await AsyncStorage.setItem('user', JSON.stringify(combinedProfile));
      Alert.alert('Успіх', 'Профіль оновлено');
      setPassword('');
      loadProfile();
    } catch(e) {
      Alert.alert('Помилка', 'Не вдалося зберегти профіль');
    }
  };


  const handleFixLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Помилка', 'Доступ до геоданих відхилено');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      let addressString = '';
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
           latitude: location.coords.latitude,
           longitude: location.coords.longitude
        });
        if (reverseGeocode && reverseGeocode.length > 0) {
           const place = reverseGeocode[0];
           addressString = `${place.city || ''}, ${place.street || ''} ${place.streetNumber || ''}`.trim();
        }
      } catch(e) { console.log('Reverse geocode error', e); }

      await api.put('/api/master/salon-info', {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        ...(addressString ? { address: addressString } : {})
      });
      
      const uStr = await AsyncStorage.getItem('user');
      if (uStr) {
          const u = JSON.parse(uStr);
          u.lat = location.coords.latitude;
          u.lng = location.coords.longitude;
          if (addressString) u.address = addressString;
          await AsyncStorage.setItem('user', JSON.stringify(u));
          setAddress(u.address || '');
      }
      
      Alert.alert('Готово', `Ваша геолокація успішно збережена!\nАдреса: ${addressString || 'Координати зафіксовані'}`);
    } catch(e) {
      Alert.alert('Помилка', 'Не вдалося визначити геолокацію');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleDeleteAccount = async () => {
    Alert.alert('УВАГА: НЕЗВОРОТНЯ ДІЯ', 'Ви точно хочете назавжди видалити свій акаунт майстра? Всі ваші прайси, записи та чати будуть видалені назавжди.', [
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={{flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 20}}>
            <TouchableOpacity onPress={handlePickAvatar} style={{alignItems: 'center'}}>
              {avatar ? (
                 <Image source={{uri: avatar}} style={styles.avatarImage} />
              ) : (
                 <View style={[styles.avatarPlaceholder, {backgroundColor: colors.border}]} />
              )}
              <Text style={{textAlign: 'center', color: colors.primary, marginTop: 5}}>Аватар</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handlePickLogo} style={{alignItems: 'center'}}>
              {salonLogo ? (
                 <Image source={{uri: salonLogo}} style={[styles.avatarImage, {borderRadius: 10}]} />
              ) : (
                 <View style={[styles.avatarPlaceholder, {backgroundColor: colors.border, borderRadius: 10}]} />
              )}
              <Text style={{textAlign: 'center', color: colors.primary, marginTop: 5}}>Логотип</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.editForm}>
            <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border}]} value={name} onChangeText={setName} placeholder="Ваше ім'я" placeholderTextColor={colors.textSecondary} />
            <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border}]} value={phone} onChangeText={setPhone} placeholder="Телефон" placeholderTextColor={colors.textSecondary} keyboardType="phone-pad" />
            <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border}]} value={salonName} onChangeText={setSalonName} placeholder="Назва салону (опц.)" placeholderTextColor={colors.textSecondary} />
            
            <Text style={{color: colors.textSecondary, marginTop: 10, marginBottom: 5, fontSize: 12}}>Соціальні мережі (посилання або нікнейми)</Text>
            <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border}]} value={instagram} onChangeText={setInstagram} placeholder="Instagram (без @)" placeholderTextColor={colors.textSecondary} />
            <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border}]} value={tiktok} onChangeText={setTiktok} placeholder="TikTok (без @)" placeholderTextColor={colors.textSecondary} />
            <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border}]} value={facebook} onChangeText={setFacebook} placeholder="Обліковий запис Facebook" placeholderTextColor={colors.textSecondary} />
            
            <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border}]} value={password} onChangeText={setPassword} placeholder="Новий пароль (залиште порожнім, щоб не змінювати)" placeholderTextColor={colors.textSecondary} secureTextEntry />
            <TouchableOpacity style={[styles.saveBtn, {backgroundColor: colors.primary, marginTop: 10}]} onPress={handleSaveProfile}>
                <Text style={styles.saveBtnText}>Зберегти зміни</Text>
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Підписка</Text>
        <View style={[styles.settingRow, { backgroundColor: colors.card, flexDirection: 'column', alignItems: 'flex-start', padding: 20 }]}>
            <Text style={[styles.settingText, { color: colors.text, fontWeight: 'bold', marginBottom: 5 }]}>
              Поточний тариф: {subData ? (subData.status === 'TRIAL' ? 'TRIAL PRO' : subData.plan) : 'Завантаження...'}
            </Text>
            
            {subData?.plan === 'FREE' && subData?.status !== 'TRIAL' && (
                <Text style={{color: colors.textSecondary, marginBottom: 10}}>Активних клієнтів: {activeClients}/10</Text>
            )}
            
            {subData?.status === 'TRIAL' && subData?.trialEndsAt && (
                <Text style={{color: colors.textSecondary, marginBottom: 10}}>Тріал закінчується: {new Date(subData.trialEndsAt).toLocaleDateString()}</Text>
            )}

            {subData?.plan === 'PRO' && subData?.status === 'ACTIVE' && subData?.currentPeriodEnd && (
                <Text style={{color: colors.textSecondary, marginBottom: 10}}>Сплачено до: {new Date(subData.currentPeriodEnd).toLocaleDateString()}</Text>
            )}

            <TouchableOpacity 
               style={[styles.saveBtn, {backgroundColor: colors.primary, width: '100%', marginTop: 10}]}
               onPress={() => navigation.navigate('SubscriptionScreen')}
            >
               <Text style={styles.saveBtnText}>
                   {(subData?.plan === 'FREE' || subData?.status === 'TRIAL' || subData?.status === 'EXPIRED') ? '⭐️ Оновити до Pro' : '💳 Керувати підпискою'}
               </Text>
            </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, {marginTop: 15}]}>Налаштування</Text>


        <View style={[styles.settingRow, { backgroundColor: colors.card, flexDirection: 'column', alignItems: 'flex-start' }]}>
          <Text style={[styles.settingText, { color: colors.text, fontWeight: 'bold' }]}>Геолокація салону</Text>
          <Text style={{color: colors.textSecondary, marginBottom: 10, marginTop: 5, fontSize: 13}}>Дозвольте новим клієнтам поблизу знаходити вас на карті.</Text>
          {address ? <Text style={{color: colors.primary, marginBottom: 10, fontWeight: 'bold'}}>Поточна адреса: {address}</Text> : null}
          <TouchableOpacity 
             style={[styles.saveBtn, {backgroundColor: '#ff9900', width: '100%'}]}
             onPress={handleFixLocation}
          >
             <Text style={styles.saveBtnText}>📍 Зафіксувати геолокацію салону</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.settingRow, { backgroundColor: colors.card }]}>

          <Text style={[styles.settingText, { color: colors.text }]}>Темна тема</Text>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{true: colors.primary}} />
        </View>
        <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
          <Text style={[styles.settingText, { color: colors.text }]}>Push-сповіщення</Text>
          <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{true: colors.primary}} />
        </View>
        <View style={[styles.settingRow, { backgroundColor: colors.card, flexDirection: 'column', alignItems: 'flex-start' }]}>
          <Text style={[styles.settingText, { color: colors.text, fontWeight: 'bold' }]}>Сповіщення Telegram</Text>
          <Text style={{color: colors.textSecondary, marginBottom: 10, marginTop: 5, fontSize: 13}}>Отримуйте сповіщення про нові записи прямо в Telegram.</Text>
          <TouchableOpacity 
             style={[styles.saveBtn, {backgroundColor: '#0088cc', width: '100%'}]}
             onPress={() => Linking.openURL(`https://t.me/NailBookProBot?start=${userId}`)}
          >
             <Text style={styles.saveBtnText}>💬 Підключити Telegram</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.settingRow, { backgroundColor: colors.card, flexDirection: 'column', alignItems: 'flex-start' }]}>
          <Text style={[styles.settingText, { color: colors.text, fontWeight: 'bold' }]}>Запросити клієнта</Text>
          <Text style={{color: colors.textSecondary, marginBottom: 10, marginTop: 5, fontSize: 13}}>Згенеруйте тимчасовий код для клієнта.</Text>
          <TouchableOpacity 
             style={[styles.saveBtn, {backgroundColor: '#32CD32', width: '100%'}]}
             onPress={async () => {
                 try {
                     const res = await api.post('/api/master/connection-code');
                     setGeneratedCode(res.data.code);
                     Alert.alert('Код згенеровано', `Ваш код: ${res.data.code}\n\nПередайте його клієнту. Дійсний 24 години.`);
                 } catch(e) {
                     Alert.alert('Помилка', 'Не вдалося згенерувати код');
                 }
             }}
          >
             <Text style={styles.saveBtnText}>🔑 Згенерувати код</Text>
          </TouchableOpacity>
          {generatedCode && (
              <View style={{marginTop: 15, padding: 15, backgroundColor: '#e6ffe6', borderRadius: 10, width: '100%', alignItems: 'center'}}>
                  <Text style={{color: '#006600', fontSize: 18, fontWeight: 'bold'}}>Ваш код: {generatedCode}</Text>
                  <Text style={{color: '#006600', fontSize: 12, marginTop: 5, textAlign: 'center'}}>Передайте його клієнту. Дійсний 24 години.</Text>
              </View>
          )}
        </View>
      </View>

      <TouchableOpacity style={[styles.logoutButton, { marginBottom: 15 }]} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Вийти з акаунту</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleDeleteAccount} style={{ alignSelf: 'center', marginBottom: 20 }}>
          <Text style={{color: '#ff0000', textDecorationLine: 'underline'}}>Видалити мій акаунт назавжди</Text>
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
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10 },
  settingText: { fontSize: 16 },
  logoutButton: { margin: 20, backgroundColor: '#FFB6C1', padding: 15, borderRadius: 20, alignItems: 'center' },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
