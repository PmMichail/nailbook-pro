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
                        <Text style={styles.city}>
                           {item.city ? `${item.city}` : 'Місто не вказано'}
                           {item.address ? ` • ${item.address}` : ''}
                        </Text>
                    </View>
                </View>
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
           <View style={[styles.codeSection, { backgroundColor: colors.card }]}>
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

            <Text style={[styles.title, { color: colors.text }]}>Майстри поруч (до 10 км)</Text>
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
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    codeSection: { padding: 15, borderRadius: 15, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    row: { flexDirection: 'row', alignItems: 'center' },
    input: { padding: 12, borderRadius: 10, borderWidth: 1 },
    btn: { backgroundColor: '#FF69B4', padding: 12, borderRadius: 10 },
    btnText: { color: '#fff', fontWeight: 'bold' },
    card: { borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
    header: { flexDirection: 'row', alignItems: 'center' },
    avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FF69B4', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    info: { flex: 1 },
    name: { fontSize: 18, fontWeight: 'bold' },
    city: { fontSize: 14, color: '#888', marginTop: 4 }
});
