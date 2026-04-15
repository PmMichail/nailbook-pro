import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import api from '../api/client';

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

  const handleFixLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Помилка', 'Доступ до геоданих відхилено');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      await api.put('/api/master/salon-info', {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
      Alert.alert('Готово', 'Ваша геолокація успішно збережена!');
    } catch(e) {
      Alert.alert('Помилка', 'Не вдалося визначити геолокацію');
    }
  };

  const handleCalendarConnect = () => {
    // В реальності відкриваємо WebView на /api/calendar/auth
    if(calendarConnected) {
      Alert.alert("Відключення", "Ви впевнені, що хочете відключити Google Calendar?", [
        { text: 'Ні', style: 'cancel' },
        { text: 'Так, відключити', onPress: () => setCalendarConnected(false), style: 'destructive' }
      ]);
    } else {
      setCalendarConnected(true);
      Alert.alert("Успіх", "Уявімо, що ви успішно пройшли OAuth авторизацію Google.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Налаштування</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Акаунт & Інтеграції</Text>
        <TouchableOpacity style={styles.menuItem} onPress={handleFixLocation}>
          <Text style={styles.menuText}>📍 Зафіксувати мою геолокацію</Text>
        </TouchableOpacity>

        
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('NotificationSettings')}>
          <Text style={styles.menuText}>Сповіщення & Telegram</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleCalendarConnect}>
          <Text style={styles.menuText}>Google Calendar</Text>
          <Text style={[styles.statusText, {color: calendarConnected ? '#4CAF50' : '#FF69B4'}]}>
            {calendarConnected ? 'Підключено' : 'Підключити'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Редагувати профіль (Аватар, ПІБ)</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Додаток</Text>
        
        <View style={styles.menuItem}>
          <Text style={styles.menuText}>Темна тема</Text>
          <Switch value={isDarkMode} onValueChange={setIsDarkMode} />
        </View>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Мова</Text>
          <Text style={styles.statusText}>Українська ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Дані та Безпека</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Експорт всіх моїх даних (JSON)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]}>
          <Text style={[styles.menuText, { color: 'red' }]}>Видалити акаунт</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>NailsBook Pro v1.0.0</Text>
        <TouchableOpacity><Text style={styles.footerLink}>Політика конфіденційності</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.footerLink}>Умови використання</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.footerLink}>Підтримка: t.me/nailbook_support</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1,  paddingHorizontal: 15 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 50, marginBottom: 20, paddingHorizontal: 5 },
  section: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 20, padding: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#999', textTransform: 'uppercase', paddingHorizontal: 15, paddingTop: 10, paddingBottom: 5 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuText: { fontSize: 16, color: '#333' },
  menuArrow: { fontSize: 18, color: '#ccc' },
  statusText: { fontSize: 14, color: '#999' },
  footer: { alignItems: 'center', marginBottom: 50, marginTop: 10 },
  footerText: { color: '#999', fontSize: 12, marginBottom: 10 },
  footerLink: { color: '#FF69B4', fontSize: 12, marginBottom: 5, textDecorationLine: 'underline' }
});
