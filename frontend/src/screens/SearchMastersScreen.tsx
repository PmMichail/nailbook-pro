import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export const SearchMastersScreen = () => {
    const { colors, isDark } = useTheme();
    const navigation = useNavigation<any>();
    const [masters, setMasters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [connectionCode, setConnectionCode] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        loadUser();
        searchNearby();
    }, []);

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
        const locationText = [item.city, item.address].filter(Boolean).join(', ');
        const hasAddress = !!locationText;
        const socials = [
            item.instagram ? { label: 'Instagram', value: item.instagram } : null,
            item.tiktok ? { label: 'TikTok', value: item.tiktok } : null,
            item.facebook ? { label: 'Facebook', value: item.facebook } : null
        ].filter(Boolean) as any[];
        
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
                        <View style={[styles.contactBlock, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text style={styles.contactLabel}>АДРЕСА САЛОНУ</Text>
                            <Text style={[styles.address, { color: hasAddress ? colors.text : '#D92D20' }]}>
                               📍 {hasAddress ? locationText : 'Майстер ще не вказав адресу салону'}
                            </Text>
                        </View>
                        {item.distance !== undefined && item.distance !== null && (
                            <Text style={{fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: '600'}}>
                                Відстань: ~{item.distance.toFixed(1)} км від вас
                            </Text>
                        )}
                        <View style={[styles.contactBlock, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text style={styles.contactLabel}>СОЦМЕРЕЖІ</Text>
                            {socials.length > 0 ? (
                                <View style={styles.socialRow}>
                                    {socials.map((social) => (
                                        <Text key={social.label} style={styles.socialChip}>{social.label}</Text>
                                    ))}
                                </View>
                            ) : (
                                <Text style={[styles.noSocialText, { color: colors.textSecondary }]}>Майстер ще не додав соцмережі</Text>
                            )}
                        </View>
                    </View>
                </View>
                <Text style={[styles.openHint, { color: colors.primary }]}>Відкрити портфоліо, адресу та соцмережі →</Text>
            </TouchableOpacity>
        );
    };

    const handleConnect = async () => {
       if (!connectionCode) return Alert.alert('Помилка', 'Введіть код');
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
    contactBlock: { borderWidth: 1, borderRadius: 18, padding: 12, marginTop: 10 },
    contactLabel: { color: '#C88D7A', fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginBottom: 6 },
    socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    socialChip: { color: '#7A3E2F', backgroundColor: '#F7E9E3', borderColor: '#E3C4B8', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, fontSize: 11, fontWeight: '900', overflow: 'hidden' },
    noSocialText: { fontSize: 12, fontStyle: 'italic' },
    openHint: { marginTop: 14, fontSize: 13, fontWeight: '800', textAlign: 'right' }
});
