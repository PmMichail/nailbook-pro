import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';

const periodMap = ['week', 'month', 'year', 'all'];

export const StatisticsScreen = () => {
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
    <ScrollView style={styles.container}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20}}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 10}}>
             <Text style={{fontSize: 24, fontWeight: 'bold', color: '#FF69B4'}}>←</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Статистика</Text>
      </View>

      <View style={styles.segmentControl}>
        {['Тиждень', 'Місяць', 'Рік', 'Вся історія'].map((label, idx) => (
           <TouchableOpacity 
             key={idx} 
             style={[styles.segmentBtn, periodIndex === idx && styles.segmentBtnActive]}
             onPress={() => setPeriodIndex(idx)}
           >
             <Text style={[styles.segmentText, periodIndex === idx && styles.segmentTextActive]}>{label}</Text>
           </TouchableOpacity>
        ))}
      </View>

      {stats ? (
        <View style={styles.content}>
           <View style={styles.card}>
             <Text style={styles.cardTitle}>Загальний дохід</Text>
             <Text style={styles.cardValue}>{stats.totalIncome} ₴</Text>
           </View>
           
           <View style={styles.row}>
             <View style={styles.cardHalf}>
               <Text style={styles.cardTitle}>Середній чек</Text>
               <Text style={styles.cardValue}>{stats.averageCheck} ₴</Text>
             </View>
             <View style={styles.cardHalf}>
               <Text style={styles.cardTitle}>Записів</Text>
               <Text style={styles.cardValue}>{stats.totalAppointments}</Text>
             </View>
           </View>

           <View style={styles.card}>
             <Text style={styles.cardTitle}>Нові клієнти</Text>
             <Text style={styles.cardValue}>{stats.newClients}</Text>
           </View>

           {stats.popularServices && stats.popularServices.length > 0 && (
             <View style={styles.listCard}>
                <Text style={styles.listTitle}>Популярні послуги</Text>
                {stats.popularServices.map((s: any, idx: number) => (
                  <View key={idx} style={styles.listItem}>
                    <Text style={styles.listLabel}>{s.service}</Text>
                    <Text style={styles.listMetric}>{s.count} разів ({s.income} ₴)</Text>
                  </View>
                ))}
             </View>
           )}

           <View style={styles.exportSection}>
             <TouchableOpacity style={styles.btnExport} onPress={() => exportData('Excel')}>
               <Text style={styles.btnExportText}>Експорт в Excel</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.btnExport} onPress={() => exportData('PDF')}>
               <Text style={styles.btnExportText}>Завантажити PDF</Text>
             </TouchableOpacity>
           </View>
        </View>
      ) : (
        <Text style={{textAlign: 'center', marginTop: 50}}>Завантаження...</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 20 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  segmentControl: { flexDirection: 'row', backgroundColor: '#333', borderRadius: 8, padding: 4, marginBottom: 20 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  segmentBtnActive: { backgroundColor: '#FF69B4' },
  segmentText: { color: '#ccc', fontSize: 12, fontWeight: 'bold' },
  segmentTextActive: { color: '#fff' },
  content: { paddingBottom: 40 },
  card: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 15, marginBottom: 15, alignItems: 'center' },
  cardTitle: { color: '#888', fontSize: 14, marginBottom: 5 },
  cardValue: { color: '#FF69B4', fontSize: 32, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  cardHalf: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 15, width: '48%', alignItems: 'center' },
  listCard: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 15, marginBottom: 15 },
  listTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', borderBottomColor: '#333', borderBottomWidth: 1, paddingVertical: 10 },
  listLabel: { color: '#ddd', fontSize: 16 },
  listMetric: { color: '#FF69B4', fontWeight: 'bold', fontSize: 16 },
  exportSection: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btnExport: { backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, width: '48%', alignItems: 'center' },
  btnExportText: { color: '#fff', fontWeight: 'bold' }
});
