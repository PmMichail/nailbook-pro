import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import api from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

export const MastersListScreen = ({ navigation }: any) => {
  const [cityQuery, setCityQuery] = useState('');
  const [masters, setMasters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionCode, setConnectionCode] = useState('');
  const { colors } = useTheme();

  const searchMasters = async () => {
    try {
       setLoading(true);
       const res = await api.get(`/api/client/masters/search?city=${encodeURIComponent(cityQuery)}`);
       setMasters(res.data);
    } catch(e) {
       Alert.alert('Помилка', 'Не вдалося завантажити список');
    } finally {
       setLoading(false);
    }
  };

  useEffect(() => {
    searchMasters();
  }, []);

  const handleConnect = async () => {
     if (!connectionCode) return Alert.alert('Помилка', 'Введіть код');
     try {
        const res = await api.post('/api/client/masters/connect', { code: connectionCode });
        if (res.data.success) {
           Alert.alert('Успіх', 'Ви успішно підключились до майстра!');
           
           // Update local masterId state
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

  const handleSelectMaster = async (id: string) => {
      Alert.alert('Підтвердження', 'Бажаєте обрати цього майстра (Тимчасово поки без коду)?', [
        {text: 'Так', onPress: async () => {
           try {
              // We'll simulate connect without code for testing search
              // Realistically we need an endpoint or just direct update if public.
              // For now, let's just alert
              Alert.alert('Функція', 'Будь ласка, отримайте код у майстра та введіть вище.');
           } catch(e) {}
        }},
        {text: 'Ні', style: 'cancel'}
      ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
       <Text style={[styles.header, { color: colors.text }]}>Пошук майстрів</Text>
       
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

       <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 20}}>
          <TextInput 
             style={[styles.input, {flex: 1, marginBottom: 0, marginRight: 10, backgroundColor: colors.card, color: colors.text, borderColor: colors.border}]}
             placeholder="Введіть місто (напр. Київ)"
             placeholderTextColor={colors.textSecondary}
             value={cityQuery}
             onChangeText={setCityQuery}
          />
          <TouchableOpacity style={styles.btn} onPress={searchMasters}>
             <Text style={styles.btnText}>Пошук</Text>
          </TouchableOpacity>
       </View>

       {loading ? (
           <ActivityIndicator size="large" color="#FF69B4" style={{marginTop: 20}} />
       ) : (
           <FlatList 
               data={masters}
               keyExtractor={(item) => item.id}
               contentContainerStyle={{paddingHorizontal: 20}}
               ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>Майстрів не знайдено</Text>}
               renderItem={({item}) => (
                   <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => handleSelectMaster(item.id)}>
                       <Image source={item.avatarUrl ? {uri: item.avatarUrl} : require('../../assets/adaptive-icon.png')} style={styles.avatar} />
                       <View style={{flex: 1}}>
                           <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                           <Text style={styles.salon}>{item.salonName || 'Майстер'}</Text>
                           <Text style={[styles.city, { color: colors.textSecondary }]}>{item.city ? item.city : 'Місто не вказано'}</Text>
                       </View>
                   </TouchableOpacity>
               )}
           />
       )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1,  paddingTop: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  codeSection: { backgroundColor: '#fff', padding: 20, marginHorizontal: 20, borderRadius: 15, marginBottom: 20, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  btn: { backgroundColor: '#FF69B4', padding: 12, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  salon: { fontSize: 14, color: '#FF69B4' },
  city: { fontSize: 12, color: '#888', marginTop: 3 },
  empty: { textAlign: 'center', color: '#888', marginTop: 20 }
});
