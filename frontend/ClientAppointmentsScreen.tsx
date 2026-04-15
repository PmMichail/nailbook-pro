import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Image, Linking, RefreshControl } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { useNavigation } from '@react-navigation/native';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const ClientAppointmentsScreen = () => {
  const navigation = useNavigation();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const statusMap: any = {
    'PENDING': 'ОЧІКУЄ ПІДТВЕРДЖЕННЯ',
    'CONFIRMED': 'ПІДТВЕРДЖЕНО',
    'CANCELLED': 'СКАСОВАНО',
    'COMPLETED': 'ВИКОНАНО'
  };

  useEffect(() => {
    fetchAppointments();

    let socket: any;
    const initSocket = async () => {
       const token = await AsyncStorage.getItem('token');
       socket = io(API_URL, { auth: { token } });
       socket.on('appointment_updated', () => {
          fetchAppointments();
       });
    };
    initSocket();

    return () => {
       if (socket) socket.disconnect();
    }
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/api/client/appointments');
      setAppointments(res.data || []);
    } catch(e) {}
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }, []);

  const clearAppointment = async (id: string) => {
    try {
      await api.delete(`/api/client/appointments/${id}`);
      Alert.alert('Успіх', 'Запис скасовано');
      fetchAppointments();
    } catch(e) {
      Alert.alert('Помилка');
    }
  };

  const showPaymentInfo = async (id: string) => {
    try {
      const res = await api.get(`/api/client/appointments/${id}/payment`);
      setPaymentDetails(res.data);
      setPaymentModalVisible(true);
    } catch(e: any) {
      Alert.alert('Помилка', e.response?.data?.error || 'Реквізити недоступні');
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
        <Text style={styles.header}>Мої Записи</Text>
        <TouchableOpacity style={{backgroundColor: '#FF69B4', padding: 10, borderRadius: 10}} onPress={() => navigation.navigate('SearchMastersScreen' as never)}>
          <Text style={{color: '#fff', fontWeight: 'bold'}}>🔍 Пошук Майстрів</Text>
        </TouchableOpacity>
      </View>
      
      {appointments.length === 0 ? (
        <Text style={styles.emptyText}>Ви ще не маєте записів</Text>
      ) : (
        appointments.map(app => (
          <View key={app.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.dateText}>{new Date(app.date).toLocaleDateString()} о {app.time}</Text>
              <Text style={[styles.statusBadge, app.status === 'CONFIRMED' && styles.statusConfirmed, app.status === 'CANCELLED' && styles.statusCancelled]}>
                {statusMap[app.status] || app.status}
              </Text>
            </View>
            <Text style={styles.masterText}>Майстер: {app.master?.name || 'Ваш Майстер'}</Text>
            {(app.finalPrice || app.originalPrice || app.price) && (
              <Text style={styles.priceText}>
                До сплати: {app.finalPrice || app.originalPrice || app.price} грн
              </Text>
            )}
            
            {app.status === 'CONFIRMED' && (
              <TouchableOpacity style={[styles.cancelBtn, {backgroundColor: '#98FB98', marginBottom: 10}]} onPress={() => showPaymentInfo(app.id)}>
                <Text style={[styles.cancelBtnText, {color: '#2e8b57'}]}>Реквізити на Оплату</Text>
              </TouchableOpacity>
            )}

            {(app.status === 'PENDING' || app.status === 'CONFIRMED') && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => clearAppointment(app.id)}>
                <Text style={styles.cancelBtnText}>Скасувати запис</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Реквізити на оплату</Text>
            
            {paymentDetails?.qrCode ? (
               <View style={{alignItems: 'center', marginBottom: 15}}>
                 <Image source={{ uri: paymentDetails.qrCode }} style={{ width: 180, height: 180 }} />
               </View>
            ) : null}

            {paymentDetails?.paymentLink ? (
               <TouchableOpacity style={[styles.cancelBtn, {backgroundColor: '#1E90FF', marginBottom: 15}]} onPress={() => Linking.openURL(paymentDetails.paymentLink)}>
                 <Text style={[styles.cancelBtnText, {color: '#fff'}]}>Відкрити посилання на оплату</Text>
               </TouchableOpacity>
            ) : null}

            {paymentDetails?.cardNumber ? (
              <>
               <Text style={styles.payText}>Картка: {paymentDetails.cardNumber}</Text>
               <Text style={styles.payText}>Банк: {paymentDetails.bankName || 'Не вказано'}</Text>
               
               <TouchableOpacity 
                 style={{backgroundColor: '#eee', padding: 8, borderRadius: 5, marginTop: 5, marginBottom: 10}}
                 onPress={async () => {
                    await Clipboard.setStringAsync(paymentDetails.cardNumber);
                    Alert.alert('Скопійовано', 'Номер картки скопійовано в буфер обміну');
                 }}
               >
                 <Text style={{textAlign: 'center', color: '#555', fontWeight: 'bold'}}>Скопіювати номер картки</Text>
               </TouchableOpacity>
              </>
            ) : null}

            <Text style={[styles.payText, {fontSize: 20, fontWeight:'bold', marginTop: 10, color: '#FF69B4'}]}>
               Сума: {paymentDetails?.amount ? paymentDetails.amount + ' грн' : 'Не вказано'}
            </Text>
            
            <TouchableOpacity style={[styles.cancelBtn, {backgroundColor: '#ccc', marginTop: 20}]} onPress={() => setPaymentModalVisible(false)}>
              <Text style={[styles.cancelBtnText, {color: '#333'}]}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1,  padding: 15 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dateText: { fontSize: 18, fontWeight: 'bold', color: '#FF69B4' },
  statusBadge: { backgroundColor: '#eee', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  statusConfirmed: { backgroundColor: '#98FB98', color: '#2e8b57' },
  statusCancelled: { backgroundColor: '#FFB6C1', color: '#8b0000' },
  masterText: { fontSize: 16, color: '#555', marginBottom: 15 },
  cancelBtn: { backgroundColor: '#ffcccc', padding: 12, borderRadius: 15, alignItems: 'center' },
  cancelBtnText: { color: '#cc0000', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  payText: { fontSize: 16, color: '#333', marginBottom: 8, textAlign: 'center' },
  priceText: { fontSize: 16, color: '#333', fontWeight: '600', marginBottom: 15 }
});
