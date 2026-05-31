import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput, Linking } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { requireAuth } from '../utils/authCheck';

export const SearchMastersScreen = () => {
    const route = useRoute();
    const { colors, isDark } = useTheme();
    const navigation = useNavigation<any>();
    const isGuest = (route.params as any)?.isGuest || false;
    const [masters, setMasters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [connectionCode, setConnectionCode] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        if (!isGuest) {
            loadUser();
        }
        searchNearby();
    }, [isGuest]);

    const loadUser = async () => {
        const str = await AsyncStorage.getItem('user');
        if (str) {
            setCurrentUser(JSON.parse(str));
        }
    };

    const searchNearby = async () => {
        setLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Помилка', 'Для пошуку майстрів поруч потрібен доступ до геолокації.');
                setLoading(false);
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            const res = await api.get(`/api/client/masters/search?lat=${location.coords.latitude}&lng=${location.coords.longitude}`);
            setMasters(res.data || []);
        } catch(e) {
            Alert.alert('Помилка', 'Не вдалося завантажити список майстрів');
        }
        setLoading(false);
    };

    const renderMaster = ({ item }: { item: any }) => {
        const isCurrentMaster = currentUser?.masterId === item.id;
        
        return (
            <TouchableOpacity 
                style={[
                    styles.card, 
                    { backgroundColor: colors.card, borderColor: isCurrentMaster ? colors.primary : colors.border },
                    isCurrentMaster && { borderWidth: 2 }
                ]} 
                onPress={() => {
                   if (isCurrentMaster) {
                       Alert.alert('Підключено', 'Це вже ваш майстер.');
                   }
                   navigation.navigate('PublicMasterGalleryScreen', { masterId: item.id, masterName: item.salonName || item.name });
                }}
            >
                {isCurrentMaster && (
                    <View style={{ position: 'absolute', top: -12, right: 10, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, zIndex: 10 }}>
                        <Text style={{ color: isDark ? '#000' : '#fff', fontSize: 12, fontWeight: 'bold' }}>⭐️ Ваш поточний майстер</Text>
                    </View>
                )}
                <View style={styles.header}>
                    <View style={styles.avatarPlaceholder}>
                        {item.avatarUrl ? (
                             <Image source={{uri: item.avatarUrl}} style={{width: 50, height: 50, borderRadius: 25}} />
                        ) : (
                             <Text style={{color: '#fff', fontSize: 20}}>💅</Text>
                        )}
                    </View>
                    <View style={styles.info}>
                        <Text style={[styles.name, { color: colors.text }]}>{item.salonName || item.name}</Text>
                        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 6}}>
                            <Text style={{fontSize: 14, marginRight: 4}}>📍</Text>
                            <Text style={[styles.city, {flex: 1, color: colors.textSecondary}]}>
                               {item.city ? `${item.city}` : 'Місто не вказано'}
                               {item.address ? ` • ${item.address}` : ''}
                            </Text>
                        </View>
                        {item.distance !== undefined && item.distance !== null && (
                            <Text style={{fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: '600'}}>
                                Відстань: ~{item.distance.toFixed(1)} км від вас
                            </Text>
                        )}
                    </View>
                </View>
                {item.instagram || item.tiktok || item.facebook ? (
                    <View style={styles.socialRow}>
                        {!!item.instagram && (
                            <TouchableOpacity style={styles.socialBtn} onPress={() => openSocial(item.instagram, 'instagram')}>
                                <Text style={styles.socialText}>Instagram</Text>
                            </TouchableOpacity>
                        )}
                        {!!item.tiktok && (
                            <TouchableOpacity style={styles.socialBtn} onPress={() => openSocial(item.tiktok, 'tiktok')}>
                                <Text style={styles.socialText}>TikTok</Text>
                            </TouchableOpacity>
                        )}
                        {!!item.facebook && (
                            <TouchableOpacity style={styles.socialBtn} onPress={() => openSocial(item.facebook, 'facebook')}>
                                <Text style={styles.socialText}>Facebook</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : null}
                <Text style={[styles.openHint, { color: colors.primary }]}>Переглянути портфоліо →</Text>
            </TouchableOpacity>
        );
    };

    const handleConnect = async () => {
       if (!connectionCode) return Alert.alert('Помилка', 'Введіть код');
       
       // Check auth for guest mode
       if (isGuest) {
         return requireAuth(navigation, 'Для підключення до майстра необхідно увійти або зареєструватися');
       }
       
       try {
          const res = await api.post('/api/client/masters/connect', { code: connectionCode });
          if (res.data.success) {
             Alert.alert('Успіх', 'Ви успішно підключились до майстра!');
             
             const uStr = await AsyncStorage.getItem('user');
             if (uStr) {
                 const u = JSON.parse(uStr);
                 u.masterId = res.data.masterId;
                 await AsyncStorage.setItem('user', JSON.stringify(u));
             }

             navigation.goBack();
          }
       } catch(e: any) {
          Alert.alert('Помилка', e.response?.data?.error || 'Невірний або прострочений код');
       }
    };

    const normalizeSocialUrl = (value: string, platform: 'instagram' | 'tiktok' | 'facebook') => {
        const clean = value.trim();
        if (!clean) return null;
        if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
        const handle = clean.replace(/^@/, '').replace(/^\/+/, '');
        if (platform === 'instagram') return `https://instagram.com/${handle}`;
        if (platform === 'tiktok') return `https://tiktok.com/@${handle}`;
        return `https://facebook.com/${handle}`;
    };

    const openSocial = (value: string, platform: 'instagram' | 'tiktok' | 'facebook') => {
        const url = normalizeSocialUrl(value, platform);
        if (url) Linking.openURL(url);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
           <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
               <Text style={styles.kicker}>BEAUTY NEAR YOU</Text>
               <Text style={[styles.title, { color: colors.text }]}>Майстри поруч</Text>
               <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Адреса, соцмережі та портфоліо майстра в один дотик.</Text>
           </View>

           <View style={[styles.codeSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
               <Text style={{fontWeight: 'bold', marginBottom: 5, color: colors.text}}>Підключитись за кодом від майстра:</Text>
               <View style={styles.row}>
                   <TextInput 
                      style={[styles.input, {flex: 1, marginBottom: 0, marginRight: 10, backgroundColor: colors.background, color: colors.text, borderColor: colors.border}]}
                      placeholder="6-значний код"
                      placeholderTextColor={colors.textSecondary}
                      value={connectionCode}
                      onChangeText={setConnectionCode}
                      keyboardType="number-pad"
                   />
                   <TouchableOpacity style={styles.btn} onPress={handleConnect}>
                      <Text style={styles.btnText}>З'єднати</Text>
                   </TouchableOpacity>
               </View>
           </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Результати пошуку до 10 км</Text>
            {loading ? (
                <ActivityIndicator color={colors.primary} size="large" style={{marginTop: 50}} />
            ) : masters.length === 0 ? (
                <Text style={{color: colors.textSecondary, textAlign: 'center', marginTop: 20}}>Не знайдено жодного майстра поруч</Text>
            ) : (
                <FlatList
                    data={masters}
                    keyExtractor={(i) => i.id}
                    renderItem={renderMaster}
                    contentContainerStyle={{paddingBottom: 20}}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15 },
    heroCard: { borderRadius: 32, borderWidth: 1, padding: 24, marginBottom: 16, shadowColor: '#D6A99A', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 26, elevation: 5 },
    kicker: { color: '#C88D7A', fontSize: 12, fontWeight: '900', letterSpacing: 2.5, marginBottom: 8 },
    title: { fontSize: 34, fontWeight: '900', marginBottom: 8 },
    subtitle: { fontSize: 14, lineHeight: 22 },
    sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 16 },
    codeSection: { padding: 16, borderRadius: 24, marginBottom: 20, borderWidth: 1, elevation: 4, shadowColor: '#C88D7A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 18 },
    row: { flexDirection: 'row', alignItems: 'center' },
    input: { padding: 12, borderRadius: 10, borderWidth: 1 },
    btn: { backgroundColor: '#C88D7A', padding: 12, borderRadius: 18 },
    btnText: { color: '#fff', fontWeight: 'bold' },
    card: { borderRadius: 28, padding: 18, marginBottom: 15, borderWidth: 1, shadowColor: '#C88D7A', shadowOffset: {width: 0, height: 12}, shadowOpacity: 0.1, shadowRadius: 22, elevation: 4 },
    header: { flexDirection: 'row', alignItems: 'center' },
    avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#C88D7A', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    info: { flex: 1 },
    name: { fontSize: 20, fontWeight: '900' },
    city: { fontSize: 14, color: '#888', fontWeight: '700' },
    address: { fontSize: 13, marginTop: 3, lineHeight: 18 },
    openHint: { marginTop: 14, fontSize: 13, fontWeight: '800', textAlign: 'right' },
    socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    socialBtn: { backgroundColor: '#F3E7E2', borderWidth: 1, borderColor: '#E0C0B4', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
    socialText: { color: '#7A3E2F', fontSize: 13, fontWeight: '900' }
});
