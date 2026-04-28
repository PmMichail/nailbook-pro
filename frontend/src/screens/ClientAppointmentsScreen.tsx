import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Image, Linking, RefreshControl } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const ClientAppointmentsScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const statusMap: any = {
    'PENDING': 'ОЧІКУЄ ПІДТВЕРДЖЕННЯ',
    'AWAITING_PREPAYMENT': 'ОЧІКУЄ ПЕРЕДОПЛАТУ',
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

  const deleteFromHistory = (id: string) => {
    Alert.alert('Підтвердження', 'Видалити цей запис з історії?', [
       { text: 'Скасувати', style: 'cancel' },
       { text: 'Видалити', style: 'destructive', onPress: async () => {
           try {
             await api.delete(`/api/client/appointments/${id}/history`);
             fetchAppointments();
           } catch(e) {
             Alert.alert('Помилка видалення');
           }
       }}
    ]);
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
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
        <Text style={[styles.header, { color: colors.text }]}>Мої Записи</Text>
      </View>
      
      {appointments.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Ви ще не маєте записів</Text>
      ) : (
        appointments.map(app => (
          <View key={app.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.dateText, { color: colors.text }]}>{new Date(app.date).toLocaleDateString()} о {app.time}</Text>
              <Text style={[
                  styles.statusBadge, 
                  { backgroundColor: isDark ? '#333' : '#eee', color: colors.textSecondary },
                  (app.status === 'CONFIRMED' || app.status === 'AWAITING_PREPAYMENT') && { backgroundColor: isDark ? 'rgba(46, 139, 87, 0.2)' : '#e6ffe6', color: '#2e8b57' },
                  app.status === 'CANCELLED' && { backgroundColor: isDark ? 'rgba(139, 0, 0, 0.2)' : '#ffe6e6', color: '#8b0000' }
              ]}>
                {statusMap[app.status] || app.status}
              </Text>
            </View>
            <Text style={[styles.masterText, { color: colors.textSecondary }]}>Майстер: {app.master?.name || 'Ваш Майстер'}</Text>
            {(app.finalPrice || app.originalPrice || app.price) && (
              <Text style={[styles.priceText, { color: colors.primary }]}>
                До сплати: {app.finalPrice || app.originalPrice || app.price} грн
              </Text>
            )}
            
            {(app.status === 'CONFIRMED' || app.status === 'AWAITING_PREPAYMENT') && (
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: '#2e8b57', borderWidth: 1, backgroundColor: 'transparent', marginBottom: 10 }]} onPress={() => showPaymentInfo(app.id)}>
                <Text style={[styles.cancelBtnText, {color: '#2e8b57'}]}>Реквізити на Оплату</Text>
              </TouchableOpacity>
            )}

            {(app.status === 'PENDING' || app.status === 'CONFIRMED' || app.status === 'AWAITING_PREPAYMENT') && (
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: '#8b0000', borderWidth: 1, backgroundColor: 'transparent' }]} onPress={() => clearAppointment(app.id)}>
                <Text style={[styles.cancelBtnText, { color: '#8b0000' }]}>Скасувати запис</Text>
              </TouchableOpacity>
            )}

            {(app.status === 'CANCELLED' || app.status === 'COMPLETED') && (
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.textSecondary, borderWidth: 1, backgroundColor: 'transparent' }]} onPress={() => deleteFromHistory(app.id)}>
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Видалити з історії 🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{paymentDetails?.isPrepayment ? 'Необхідна Передоплата' : 'Реквізити на оплату'}</Text>
            
            {paymentDetails?.isPrepayment && (
              <View style={{backgroundColor: 'rgba(255, 165, 0, 0.2)', padding: 10, borderRadius: 10, marginBottom: 15}}>
                 <Text style={{color: colors.text, textAlign: 'center', fontWeight: 'bold'}}>Увага!</Text>
                 <Text style={{color: colors.text, textAlign: 'center', fontSize: 12}}>Сплатіть передоплату та надішліть скріншот майстру в чат.</Text>
                 <Text style={{color: colors.text, textAlign: 'center', fontSize: 12, marginTop: 5}}>Запис скасується автоматично до: {new Date(paymentDetails.prepaymentDeadline).toLocaleTimeString('uk-UA', {hour: '2-digit', minute:'2-digit'})}</Text>
              </View>
            )}
            
            {paymentDetails?.qrCode ? (
               <View style={{alignItems: 'center', marginBottom: 15}}>
                 <Image source={{ uri: paymentDetails.qrCode }} style={{ width: 180, height: 180 }} />
               </View>
            ) : null}

            {paymentDetails?.paymentLink ? (
               <TouchableOpacity style={[styles.cancelBtn, {backgroundColor: colors.primary, marginBottom: 15, borderWidth: 0}]} onPress={() => Linking.openURL(paymentDetails.paymentLink)}>
                 <Text style={[styles.cancelBtnText, {color: isDark ? '#000' : '#fff'}]}>Відкрити посилання на оплату</Text>
               </TouchableOpacity>
            ) : null}

            {paymentDetails?.cardNumber ? (
              <>
               <Text style={[styles.payText, { color: colors.text }]}>Картка: {paymentDetails.cardNumber}</Text>
               <Text style={[styles.payText, { color: colors.textSecondary }]}>Банк: {paymentDetails.bankName || 'Не вказано'}</Text>
               
               <TouchableOpacity 
                 style={{backgroundColor: colors.border, padding: 8, borderRadius: 5, marginTop: 5, marginBottom: 10}}
                 onPress={async () => {
                    await Clipboard.setStringAsync(paymentDetails.cardNumber);
                    Alert.alert('Скопійовано', 'Номер картки скопійовано в буфер обміну');
                 }}
               >
                 <Text style={{textAlign: 'center', color: colors.text, fontWeight: 'bold'}}>Скопіювати номер картки</Text>
               </TouchableOpacity>
              </>
            ) : null}

            <Text style={[styles.payText, {fontSize: 20, fontWeight:'bold', marginTop: 10, color: colors.primary}]}>
               Сума: {paymentDetails?.amount ? paymentDetails.amount + ' грн' : 'Не вказано'}
            </Text>
            
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.textSecondary, borderWidth: 1, backgroundColor: 'transparent', marginTop: 20 }]} onPress={() => setPaymentModalVisible(false)}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1,  padding: 15 },
  header: { fontSize: 24, fontFamily: 'serif', fontStyle: 'italic', marginBottom: 20 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  card: { borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  dateText: { fontSize: 18, fontFamily: 'serif', fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, fontSize: 10, fontWeight: 'bold', overflow: 'hidden' },
  masterText: { fontSize: 14, marginBottom: 10 },
  priceText: { fontSize: 16, fontWeight: '600', marginBottom: 20 },
  cancelBtn: { padding: 15, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 24, elevation: 5 },
  modalTitle: { fontSize: 22, fontFamily: 'serif', fontStyle: 'italic', marginBottom: 20, textAlign: 'center' },
  payText: { fontSize: 16, marginBottom: 8, textAlign: 'center' }
});
