import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';

const periodMap = ['week', 'month', 'year', 'all'];

export const StatisticsScreen = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const [periodIndex, setPeriodIndex] = useState(0);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStatistics();
  }, [periodIndex]);

  const fetchStatistics = async () => {
    try {
      const p = periodMap[periodIndex];
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get(`/api/master/statistics?period=${p}&date=${today}`);
      setStats(res.data);
    } catch(e) {
      console.log('Error fetching stats:', e);
    }
  };

  const exportData = (format: string) => {
    Alert.alert('Експорт', `Запит на генерацію ${format} відправлено.`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20}}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 10}}>
             <Text style={{fontSize: 24, fontWeight: 'bold', color: colors.primary}}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.header, { color: colors.text }]}>Статистика</Text>
      </View>

      <View style={[styles.segmentControl, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]}>
        {['Тиждень', 'Місяць', 'Рік', 'Вся історія'].map((label, idx) => (
           <TouchableOpacity 
             key={idx} 
             style={[styles.segmentBtn, periodIndex === idx && { backgroundColor: colors.primary }]}
             onPress={() => setPeriodIndex(idx)}
           >
             <Text style={[styles.segmentText, { color: isDark ? '#ccc' : '#666' }, periodIndex === idx && { color: isDark ? '#000' : '#fff' }]}>{label}</Text>
           </TouchableOpacity>
        ))}
      </View>

      {stats ? (
        <View style={styles.content}>
           <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
             <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Загальний дохід</Text>
             <Text style={[styles.cardValue, { color: colors.primary }]}>{stats.totalIncome} ₴</Text>
           </View>
           
           <View style={styles.row}>
             <View style={[styles.cardHalf, { backgroundColor: colors.card, borderColor: colors.border }]}>
               <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Середній чек</Text>
               <Text style={[styles.cardValue, { color: colors.primary, fontSize: 28 }]}>{stats.averageCheck} ₴</Text>
             </View>
             <View style={[styles.cardHalf, { backgroundColor: colors.card, borderColor: colors.border }]}>
               <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Записів</Text>
               <Text style={[styles.cardValue, { color: colors.primary, fontSize: 28 }]}>{stats.totalAppointments}</Text>
             </View>
           </View>

           <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
             <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Нові клієнти</Text>
             <Text style={[styles.cardValue, { color: colors.primary }]}>{stats.newClients}</Text>
           </View>

           {stats.popularServices && stats.popularServices.length > 0 && (
             <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.listTitle, { color: colors.text }]}>Популярні послуги</Text>
                {stats.popularServices.map((s: any, idx: number) => (
                  <View key={idx} style={[styles.listItem, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.listLabel, { color: colors.text }]}>{s.service}</Text>
                    <Text style={[styles.listMetric, { color: colors.primary }]}>{s.count} разів ({s.income} ₴)</Text>
                  </View>
                ))}
             </View>
           )}

           <View style={styles.exportSection}>
             <TouchableOpacity style={[styles.btnExport, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]} onPress={() => exportData('Excel')}>
               <Text style={[styles.btnExportText, { color: colors.text }]}>Експорт в Excel</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.btnExport, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]} onPress={() => exportData('PDF')}>
               <Text style={[styles.btnExportText, { color: colors.text }]}>Завантажити PDF</Text>
             </TouchableOpacity>
           </View>
        </View>
      ) : (
        <Text style={{textAlign: 'center', marginTop: 50, color: colors.textSecondary}}>Завантаження...</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { fontSize: 28, fontFamily: 'serif', fontStyle: 'italic', fontWeight: 'bold' },
  segmentControl: { flexDirection: 'row', borderRadius: 8, padding: 4, marginBottom: 20 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  segmentText: { fontSize: 12, fontWeight: 'bold' },
  content: { paddingBottom: 40 },
  card: { padding: 20, borderRadius: 15, marginBottom: 15, alignItems: 'center', borderWidth: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  cardHalf: { padding: 20, borderRadius: 15, width: '48%', alignItems: 'center', borderWidth: 1 },
  cardTitle: { fontSize: 14, marginBottom: 5 },
  cardValue: { fontSize: 32, fontWeight: 'bold' },
  listCard: { padding: 20, borderRadius: 15, marginBottom: 15, borderWidth: 1 },
  listTitle: { fontSize: 18, fontFamily: 'serif', fontStyle: 'italic', fontWeight: 'bold', marginBottom: 15 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, paddingVertical: 10 },
  listLabel: { fontSize: 16 },
  listMetric: { fontWeight: 'bold', fontSize: 16 },
  exportSection: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btnExport: { paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, width: '48%', alignItems: 'center' },
  btnExportText: { fontWeight: 'bold' }
});
