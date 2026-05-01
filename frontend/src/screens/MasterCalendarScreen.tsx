import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import api from '../api/client';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

LocaleConfig.defaultLocale = 'ua';

export const MasterCalendarScreen = () => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [totalSum, setTotalSum] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
     loadDay();
  }, [selectedDay]);

  const loadDay = async () => {
     try {
        setLoading(true);
        const res = await api.get(`/api/master/appointments/by-date?date=${selectedDay}`);
        setAppointments(res.data.appointments || []);
        setTotalSum(res.data.totalSum || 0);
     } catch (e) {
        console.log('Error loading day data', e);
     } finally {
        setLoading(false);
     }
  };

  const markedDates: any = {
    [selectedDay]: { selected: true, selectedColor: '#C88D7A' }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
       if (newStatus === 'CONFIRMED') {
          await api.put(`/api/master/appointments/${id}/confirm`, {});
       } else if (newStatus === 'CANCELLED') {
          await api.put(`/api/master/appointments/${id}/cancel`, {});
       }
       Alert.alert('Успіх', `Статус оновлено`);
       loadDay();
    } catch(e) {
       Alert.alert('Помилка', 'Не вдалося оновити статус');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Мій Розклад</Text>

      <View style={[styles.calendarWrapper, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
        <Calendar
          current={selectedDay}
          onDayPress={(day: any) => setSelectedDay(day.dateString)}
          markedDates={markedDates}
          theme={{
            calendarBackground: colors.card,
            textSectionTitleColor: colors.textSecondary,
            selectedDayBackgroundColor: colors.text,
            selectedDayTextColor: colors.background,
            todayTextColor: colors.primary,
            dayTextColor: colors.text,
            textDisabledColor: isDark ? '#444444' : '#d9e1e8',
            dotColor: colors.primary,
            selectedDotColor: colors.background,
            arrowColor: colors.text,
            monthTextColor: colors.text,
            textMonthFontWeight: 'bold',
          }}
        />
      </View>

      <TouchableOpacity 
        style={{backgroundColor: colors.text, padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20, elevation: 5, shadowColor: colors.text, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3}}
        onPress={() => {
           Alert.alert('Підтвердження', 'Ви впевнені, що хочете приховати всі записи до сьогоднішнього дня? (вони залишаться в статистиці)', [
              {text: 'Скасувати', style: 'cancel'},
              {text: 'Очистити', onPress: async () => {
                 try {
                    await api.put('/api/master/appointments/archive-old');
                    Alert.alert('Готово', 'Старі записи приховані з календаря');
                    loadDay();
                 } catch(e) { Alert.alert('Помилка'); }
              }}
           ]);
        }}
      >
        <Text style={{color: colors.background, fontWeight: 'bold'}}>🧹 Очистити минулі записи</Text>
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
        <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Записи на {selectedDay}</Text>
            <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.background }]}>
                <Text style={[styles.editBtnText, { color: colors.textSecondary }]}>✎ Ред. день</Text>
            </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : appointments.length === 0 ? (
          <Text style={[styles.noData, { color: colors.textSecondary }]}>{t('dashboard.noRecordsToday', {defaultValue: 'Немає записів на цей день'})}</Text>
        ) : (
          <>
            <Text style={{fontWeight: 'bold', color: colors.text, marginBottom: 10, fontSize: 16}}>
              Загальна сума за день: {totalSum} грн
            </Text>
            {appointments.map((app) => (
              <View key={app.id} style={[styles.appointmentCard, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.appName, { color: colors.text }]}>{app.client?.name || 'Клієнт'}</Text>
                  <Text style={[styles.appTime, { color: colors.textSecondary }]}>{app.time}</Text>
                  <Text style={{color: colors.textSecondary, fontSize: 12}}>
                    {app.service ? app.service : 'Послуга не вказана'} | {(app.finalPrice || app.originalPrice || app.price) ? (app.finalPrice || app.originalPrice || app.price) + ' грн' : 'Ціна не вказана'}
                  </Text>
                  <Text style={[styles.appStatus, app.status === 'CONFIRMED' ? {color:'green'} : {color: colors.textSecondary}]}>
                    {app.status === 'PENDING' ? 'ОЧІКУЄ' : app.status === 'CONFIRMED' ? 'ПІДТВЕРДЖЕНО' : app.status}
                  </Text>
                </View>
                <View style={[styles.appActions, { flexDirection: 'column', justifyContent: 'center' }]}>
                  {app.status === 'PENDING' && (
                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#98FB98', marginBottom: 5}]} onPress={() => updateStatus(app.id, 'CONFIRMED')}>
                      <Text style={styles.actionBtnText}>✓</Text>
                    </TouchableOpacity>
                  )}
                  {app.status !== 'CANCELLED' && (
                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: colors.border}]} onPress={() => updateStatus(app.id, 'CANCELLED')}>
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>✗</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1,  padding: 15 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  calendarWrapper: { borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 40, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#C88D7A' },
  editBtn: { backgroundColor: '#eee', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  editBtnText: { fontSize: 12, color: '#555' },
  noData: { color: '#999', fontStyle: 'italic', marginTop: 10 },
  appointmentCard: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 10 },
  appName: { fontSize: 16, fontWeight: 'bold' },
  appTime: { fontSize: 14, color: '#777' },
  appStatus: { fontSize: 12, marginTop: 5, fontWeight: 'bold' },
  appActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { width: 35, height: 35, borderRadius: 17.5, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  actionBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' }
});
