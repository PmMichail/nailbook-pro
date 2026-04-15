import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];

export const MasterDashboardScreen = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
    const currentWeek = React.useMemo(() => {
    const base = new Date();
    const day = base.getDay() || 7;
    base.setDate(base.getDate() - day + 1);
    return Array.from({length: 7}, (_, i) => {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        return d.getDate();
    });
  }, []);

  const [loading, setLoading] = useState(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(new Date().toISOString().split('T')[0]);
  
  // Weekly Settings State
  const [weeklySettings, setWeeklySettings] = useState<any[]>(
    Array.from({length: 7}, (_, i) => ({ dayOfWeek: i+1, workStart: '09:00', workEnd: '18:00', timePerClient: 120, breakStart: '', breakEnd: '', isWorking: i+1 < 6 }))
  );
  const [activeEditDay, setActiveEditDay] = useState(1); // 1-7
  
  const [slots, setSlots] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [masterProfile, setMasterProfile] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [prices, setPrices] = useState<any[]>([]);

  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [editPriceId, setEditPriceId] = useState<string|null>(null);
  const [priceForm, setPriceForm] = useState({ service: '', price: '' });

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmApp, setConfirmApp] = useState<any>(null);
  const [confirmPrice, setConfirmPrice] = useState('');
  const [confirmNote, setConfirmNote] = useState('');

  const [payCard, setPayCard] = useState('');
  const [payBank, setPayBank] = useState('');
  const [payLink, setPayLink] = useState('');

  const statusMap: any = {
    'PENDING': 'ОЧІКУЄ ПІДТВЕРДЖЕННЯ',
    'CONFIRMED': 'ПІДТВЕРДЖЕНО',
    'CANCELLED': 'СКАСОВАНО',
    'COMPLETED': 'ВИКОНАНО'
  };

  useEffect(() => {
    fetchProfile();
    fetchSettings();
    fetchSlots();
    fetchAppointments();
    fetchPrices();
    fetchPaymentInfo();
  }, [selectedCalendarDay]);

  const fetchPaymentInfo = async () => {
    try {
      const res = await api.get('/api/master/payment-details');
      if (res.data?.info) {
         setPayCard(res.data.info.cardNumber || '');
         setPayBank(res.data.info.bankName || '');
         setPayLink(res.data.info.qrCodeUrl || '');
      }
    } catch(e) {}
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchSettings();
      fetchSlots();
      fetchAppointments();
      fetchPrices();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      // Just fetching self info via settings or we need a profile endpoint, let's pull from AsyncStorage
      const uStr = await AsyncStorage.getItem('user');
      if (uStr) {
        setMasterProfile(JSON.parse(uStr));
      }
    } catch(e) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get(`/api/master/settings`);
      if (res.data && res.data.length > 0) {
        setWeeklySettings(res.data);
      }
    } catch(e) {}
  };

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/master/slots?date=${selectedCalendarDay}`);
      setSlots(res.data.slots || []);
    } catch(e) {}
    setLoading(false);
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get(`/api/master/appointments`);
      setAppointments(res.data || []);
    } catch(e) {}
  };

  const fetchPrices = async () => {
    try {
      const res = await api.get('/api/master/prices');
      setPrices(res.data || []);
    } catch(e) {}
  };

  const savePriceItem = async () => {
    try {
      if (editPriceId) {
         await api.put('/api/master/prices', { id: editPriceId, service: priceForm.service, price: parseInt(priceForm.price, 10) });
      } else {
         await api.post('/api/master/prices', { service: priceForm.service, price: parseInt(priceForm.price, 10) });
      }
      setPriceModalVisible(false);
      fetchPrices();
    } catch(e) { Alert.alert('Помилка', 'Не вдалося зберегти'); }
  };

  const deletePriceItem = async (id: string) => {
    try {
      await api.delete(`/api/master/prices/${id}`);
      fetchPrices();
    } catch(e) {}
  };

  const handleUpdateCurrentDaySetting = (field: string, value: any) => {
    setWeeklySettings(prev => prev.map(s => s.dayOfWeek === activeEditDay ? { ...s, [field]: value } : s));
  };

  const handleCopyToAllDays = () => {
    const currentDayConfig = weeklySettings.find(s => s.dayOfWeek === activeEditDay);
    if (!currentDayConfig) return;
    setWeeklySettings(prev => prev.map(s => ({
      ...s,
      workStart: currentDayConfig.workStart,
      workEnd: currentDayConfig.workEnd,
      timePerClient: currentDayConfig.timePerClient,
      breakStart: currentDayConfig.breakStart,
      breakEnd: currentDayConfig.breakEnd
    })));
    Alert.alert('Копіювання', 'Налаштування скопійовано на всі дні.');
  };

  const saveSettings = async () => {
    console.log('[FRONTEND] Відправка PUT /master/settings з даними тижня');
    try {
      const res = await api.put(`/api/master/settings`, { weeklySettings });
      if (res.status === 200 || res.status === 201) {
          Alert.alert('Успіх', 'Графік збережено!');
          fetchSlots();
      }
    } catch(e: any) {
      Alert.alert('Помилка', 'Не вдалося зберегти налаштування');
    }
  };

  const toggleSlotBlock = async (slot: any) => {
    try {
      if (slot.isBlocked) {
        await api.delete(`/api/master/slots/unblock`, { data: { date: selectedCalendarDay, time: slot.time } });
      } else {
        await api.post(`/api/master/slots/block`, { date: selectedCalendarDay, time: slot.time, reason: 'Manual block' });
      }
      fetchSlots();
    } catch(e) {
      Alert.alert('Error');
    }
  };

  const updateAppStatus = async (id: string, action: 'confirm' | 'cancel') => {
    try {
      if (action === 'cancel') {
         await api.put(`/api/master/appointments/${id}/cancel`);
         fetchAppointments();
      }
    } catch(e) {}
  };

  const submitConfirm = async () => {
    try {
      await api.put(`/api/master/appointments/${confirmApp.id}/confirm`, {
         price: confirmPrice ? parseInt(confirmPrice, 10) : undefined,
         note: confirmNote
      });
      setConfirmModalVisible(false);
      fetchAppointments();
    } catch(e) {}
  };

  const savePaymentDetails = async () => {
    try {
      await api.put('/api/master/payment-details', {
         cardNumber: payCard,
         bankName: payBank,
         paymentLink: payLink
      });
      Alert.alert('Успіх', 'Реквізити збережено');
    } catch(e) {}
  };

  const currentDayAppoints = appointments.filter((a: any) => String(a.date).includes(selectedCalendarDay));
  const activeDaySetting = weeklySettings.find(s => s.dayOfWeek === activeEditDay) || weeklySettings[0];
  const inviteLink = `https://nailbook.pro/m/${masterProfile?.linkSlug || masterProfile?.id || 'demo'}`;

  const copyLink = async () => {
    await Clipboard.setStringAsync(inviteLink);
    Alert.alert('Скопійовано', 'Посилання збережене в буфер обміну');
  };

  const changeDay = (offset: number) => {
    const current = new Date(selectedCalendarDay);
    current.setDate(current.getDate() + offset);
    setSelectedCalendarDay(current.toISOString().split('T')[0]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Dashboard</Text>
      
      {/* Top Actions */}
      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20}}>
        <TouchableOpacity style={[styles.btnPrimary, {flex: 1, marginRight: 5}]} onPress={() => setQrModalVisible(true)}>
          <Text style={styles.btnPrimaryText}>QR Код</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnSecondary, {flex: 0.5}]} onPress={() => navigation.navigate('StatisticsScreen' as never)}>
          <Text style={{color: colors.primary, fontWeight: 'bold'}}>Статист.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnSecondary, {flex: 0.5, marginLeft: 5}]} onPress={() => navigation.navigate('PaymentSetupScreen' as never)}>
          <Text style={{color: colors.primary, fontWeight: 'bold'}}>Оплата</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.btnSecondary, {marginBottom: 20, width: '100%'}]} onPress={() => navigation.navigate('MasterClientsScreen' as never)}>
          <Text style={{color: colors.primary, fontWeight: 'bold', fontSize: 16}}>👥 Мої Клієнти</Text>
      </TouchableOpacity>


      {/* Settings Form for Weekly */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.cardTitle}>Налаштування Графіка</Text>

        <View style={styles.daysRow}>
          {DAYS.map((day, ix) => (
            <TouchableOpacity 
              key={ix} 
              style={[styles.dayCircle, { width: 45, height: 45, borderRadius: 22.5 }, activeEditDay === ix + 1 && { backgroundColor: colors.primary }]}
              onPress={() => setActiveEditDay(ix + 1)}
            >
              <Text style={{ color: activeEditDay === ix + 1 ? '#fff' : colors.text, fontSize: 12, fontWeight: 'bold' }}>{day}</Text>
              <Text style={{ color: activeEditDay === ix + 1 ? '#fff' : colors.textSecondary, fontSize: 10 }}>{currentWeek[ix]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={{marginBottom: 15}}
          onPress={() => handleUpdateCurrentDaySetting('isWorking', !activeDaySetting.isWorking)}
        >
          <Text style={{color: colors.primary, fontWeight: 'bold'}}>
            {activeDaySetting.isWorking ? '✅ Робочий день' : '❌ Вихідний'} (Натисніть щоб змінити)
          </Text>
        </TouchableOpacity>

        {activeDaySetting.isWorking && (
          <>
            <View style={styles.row}>
                <View style={{flex: 1, paddingRight: 10}}>
                    <Text style={[styles.label, {color: colors.textSecondary}]}>Початок:</Text>
                    <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border}]} value={activeDaySetting.workStart} onChangeText={(v) => handleUpdateCurrentDaySetting('workStart', v)} />
                </View>
                <View style={{flex: 1}}>
                    <Text style={[styles.label, {color: colors.textSecondary}]}>Кінець:</Text>
                    <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border}]} value={activeDaySetting.workEnd} onChangeText={(v) => handleUpdateCurrentDaySetting('workEnd', v)} />
                </View>
            </View>

            <View style={styles.row}>
                <View style={{flex: 1, paddingRight: 10}}>
                    <Text style={[styles.label, {color: colors.textSecondary}]}>Поч. Перерви:</Text>
                    <TextInput placeholder="12:00" placeholderTextColor={colors.textSecondary} style={[styles.input, {color: colors.text, borderColor: colors.border}]} value={activeDaySetting.breakStart} onChangeText={(v) => handleUpdateCurrentDaySetting('breakStart', v)} />
                </View>
                <View style={{flex: 1}}>
                    <Text style={[styles.label, {color: colors.textSecondary}]}>Кін. Перерви:</Text>
                    <TextInput placeholder="13:00" placeholderTextColor={colors.textSecondary} style={[styles.input, {color: colors.text, borderColor: colors.border}]} value={activeDaySetting.breakEnd} onChangeText={(v) => handleUpdateCurrentDaySetting('breakEnd', v)} />
                </View>
            </View>

            <Text style={[styles.label, {color: colors.textSecondary}]}>Час на клієнта (хв):</Text>
            <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border}]} value={activeDaySetting.timePerClient?.toString()} onChangeText={(v) => handleUpdateCurrentDaySetting('timePerClient', v)} keyboardType="numeric" />
            
            <TouchableOpacity style={{alignItems: 'flex-end', marginBottom: 15}} onPress={handleCopyToAllDays}>
              <Text style={{color: colors.primary, textDecorationLine: 'underline'}}>Скопіювати на всі дні</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.btnPrimary} onPress={saveSettings}>
          <Text style={styles.btnPrimaryText}>Зберегти Розклад</Text>
        </TouchableOpacity>
      </View>

      {/* Slots Grid */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
          <TouchableOpacity onPress={() => changeDay(-1)} style={{padding: 5}}><Text style={{fontSize: 20, color: colors.primary}}>◀</Text></TouchableOpacity>
          <Text style={styles.cardTitle}>{selectedCalendarDay}</Text>
          <TouchableOpacity onPress={() => changeDay(1)} style={{padding: 5}}><Text style={{fontSize: 20, color: colors.primary}}>▶</Text></TouchableOpacity>
        </View>
        {loading ? <ActivityIndicator color={colors.primary} /> : (
            <View style={styles.slotsGrid}>
                {slots.map((s, i) => {
                    let bgColor = '#98FB98'; // Green for available
                    let displayIcon = '';
                    if (s.isBlocked) {
                        bgColor = isDark ? '#444' : '#e0e0e0';
                        displayIcon = '🔒';
                    } else if (s.appointment) {
                        bgColor = '#FFB6C1'; 
                        displayIcon = '👤';
                    }

                    return (
                        <TouchableOpacity key={i} style={[styles.slotBtn, { backgroundColor: bgColor }]} onPress={() => {
                            if (!s.appointment) toggleSlotBlock(s);
                        }}>
                            <Text style={styles.slotBtnText}>{s.time} {displayIcon}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.cardTitle}>💳 Налаштування оплати</Text>
        
        <Text style={styles.label}>Номер картки (IBAN)</Text>
        <TextInput
          placeholder="Номер картки (IBAN)"
          placeholderTextColor="#666"
          value={payCard}
          onChangeText={setPayCard}
          style={[styles.input, {color: colors.text, borderColor: colors.border}]}
        />
        
        <Text style={styles.label}>Назва банку</Text>
        <TextInput
          placeholder="ПриватБанк, Monobank..."
          placeholderTextColor="#666"
          value={payBank}
          onChangeText={setPayBank}
          style={[styles.input, {color: colors.text, borderColor: colors.border}]}
        />

        <Text style={styles.label}>Посилання на оплату (Банка, Send, опціонально)</Text>
        <TextInput
          placeholder="https://send.monobank.ua/..."
          placeholderTextColor="#666"
          value={payLink}
          onChangeText={setPayLink}
          style={[styles.input, {color: colors.text, borderColor: colors.border}]}
        />
        
        <TouchableOpacity style={styles.btnPrimary} onPress={savePaymentDetails}>
          <Text style={styles.btnPrimaryText}>Зберегти реквізити</Text>
        </TouchableOpacity>
      </View>

      {/* Appointments */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.cardTitle}>Сьогоднішні записи (або обраний день)</Text>
        {currentDayAppoints.length === 0 && <Text style={[styles.subtext, {color: colors.textSecondary}]}>Немає записів</Text>}
        {currentDayAppoints.map((app: any) => (
            <View key={app.id} style={[styles.appointmentItem, {borderBottomColor: colors.border}]}>
                <View style={styles.appInfo}>
                    <TouchableOpacity onPress={() => setSelectedClient(app)}>
                      <Text style={[styles.appName, {color: '#FF69B4', fontWeight: 'bold'}]}>
                        Клієнт: {app.client?.name || app.client?.phone || app.clientId.substring(0,6)} (Деталі)
                      </Text>
                    </TouchableOpacity>
                    <Text style={[{color: colors.textSecondary, fontSize: 12, marginVertical: 3}]}>
                      Дата: {new Date(app.date).toISOString().split('T')[0]} о {app.time}
                    </Text>
                    <Text style={[styles.appStatus, app.status === 'CONFIRMED' && {color: 'green'}]}>
                      {statusMap[app.status] || app.status}
                    </Text>
                </View>
                <View style={styles.appActions}>
                    {app.status === 'PENDING' && (
                        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#98FB98'}]} onPress={() => {
                           setConfirmApp(app);
                           setConfirmPrice(app.price ? app.price.toString() : '');
                           setConfirmNote('');
                           setConfirmModalVisible(true);
                        }}>
                            <Text style={styles.actionIcon}>✓</Text>
                        </TouchableOpacity>
                    )}
                    {app.status !== 'CANCELLED' && (
                        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#FFB6C1'}]} onPress={() => updateAppStatus(app.id, 'cancel')}>
                            <Text style={styles.actionIcon}>✗</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#333'}]} onPress={() => {
                        Alert.alert('Заблокувати', 'Бажаєте заблокувати номер цього клієнта?', [
                           {text: 'Ні', style: 'cancel'},
                           {text: 'Так', style: 'destructive', onPress: async () => {
                             if (!app.client?.phone) return Alert.alert('Помилка', 'Телефон відсутній');
                             try {
                               await api.post('/api/master/blocked-phones', { phone: app.client.phone, reason: 'Блокування з дашборду' });
                               Alert.alert('Заблоковано');
                             } catch(e) { Alert.alert('Помилка', 'Вже в блоці або помилка'); }
                           }}
                        ]);
                    }}>
                        <Text style={styles.actionIcon}>🚫</Text>
                    </TouchableOpacity>
                </View>
            </View>
        ))}
      </View>

      {/* Прайс-лист */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.cardTitle}>Мої ціни (Прайс-лист)</Text>
        {prices.map(item => (
          <View key={item.id} style={[styles.row, {marginBottom: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 10}]}>
            <Text style={{color: colors.text, flex: 1}}>{item.service}: {item.price} грн</Text>
            <TouchableOpacity onPress={() => { setEditPriceId(item.id); setPriceForm({service: item.service, price: item.price.toString()}); setPriceModalVisible(true); }} style={{marginRight: 15}}>
               <Text>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deletePriceItem(item.id)}>
               <Text>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={[styles.btnPrimary, {marginTop: 10}]} onPress={() => { setEditPriceId(null); setPriceForm({service: '', price: ''}); setPriceModalVisible(true); }}>
           <Text style={styles.btnPrimaryText}>+ Додати послугу</Text>
        </TouchableOpacity>
      </View>

      {/* Client Details Modal */}
      <Modal visible={!!selectedClient} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>Деталі запису</Text>
            <Text style={{color: colors.text, marginBottom: 5}}>Ім'я: {selectedClient?.client?.name || 'Без імені'}</Text>
            <Text style={{color: colors.text, marginBottom: 5}}>Телефон: {selectedClient?.client?.phone || 'Приховано'}</Text>
            <Text style={{color: colors.text, marginBottom: 5}}>Послуга: {selectedClient?.service || 'Не вказано'}</Text>
            <Text style={{color: colors.text, marginBottom: 15}}>Ціна: {selectedClient?.price ? selectedClient.price + ' грн' : 'Не вказано'}</Text>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => setSelectedClient(null)}>
              <Text style={styles.btnPrimaryText}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Price Edit Modal */}
      <Modal visible={priceModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>Редагувати послугу</Text>
            <Text style={styles.label}>Назва послуги:</Text>
            <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border}]} placeholder="Манікюр..." placeholderTextColor="#666" value={priceForm.service} onChangeText={t => setPriceForm({...priceForm, service: t})} />
            <Text style={styles.label}>Ціна (грн):</Text>
            <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border}]} placeholder="450" placeholderTextColor="#666" keyboardType="numeric" value={priceForm.price} onChangeText={t => setPriceForm({...priceForm, price: t})} />
            
            <TouchableOpacity style={[styles.btnPrimary, {marginBottom: 10}]} onPress={savePriceItem}>
              <Text style={styles.btnPrimaryText}>Зберегти</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => setPriceModalVisible(false)}>
              <Text style={{color: colors.primary, fontWeight: 'bold'}}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirm Appointment Modal */}
      <Modal visible={confirmModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>Підтвердити запис</Text>
            <Text style={{color: colors.text, marginBottom: 10}}>Ви можете змінити ціну або залишити базову. Також можна додати примітку.</Text>
            
            <Text style={styles.label}>Нова ціна (грн) - опціонально:</Text>
            <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border}]} placeholder="Введіть суму" placeholderTextColor="#666" keyboardType="numeric" value={confirmPrice} onChangeText={setConfirmPrice} />
            
            <Text style={styles.label}>Примітка клієнту (необов'язково):</Text>
            <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border, height: 80}]} placeholder="Коментар..." placeholderTextColor="#666" multiline value={confirmNote} onChangeText={setConfirmNote} />

            <TouchableOpacity style={[styles.btnPrimary, {marginBottom: 10}]} onPress={submitConfirm}>
              <Text style={styles.btnPrimaryText}>Підтвердити</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => setConfirmModalVisible(false)}>
              <Text style={{color: colors.primary, fontWeight: 'bold'}}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={qrModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>Ваше посилання</Text>
            <QRCode value={inviteLink} size={200} />
            <Text style={[styles.linkText, {color: colors.primary}]} onPress={copyLink}>{inviteLink}</Text>
            
            <TouchableOpacity style={styles.btnSecondary} onPress={() => Alert.alert('Купон', 'Ваш клієнт може використати код: ' + masterProfile?.linkSlug + ' при реєстрації, щоб отримати сертифікат!')}>
              <Text style={{color: colors.primary, fontWeight: 'bold'}}>Надіслати як Купон-Сертифікат</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnPrimary, {marginTop: 15}]} onPress={() => setQrModalVisible(false)}>
              <Text style={styles.btnPrimaryText}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{height: 50}}/>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, borderWidth: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15, color: '#FF69B4' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dayCircle: { width: 35, height: 35, borderRadius: 17.5, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FF69B4' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 15, fontSize: 16 },
  btnPrimary: { backgroundColor: '#FF69B4', borderRadius: 20, padding: 15, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnSecondary: { backgroundColor: 'transparent', borderRadius: 20, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#FF69B4' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  slotBtn: { padding: 15, borderRadius: 10, margin: 5, width: '45%', alignItems: 'center' },
  slotBtnText: { fontWeight: 'bold', color: '#111' },
  appointmentItem: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, paddingBottom: 10, marginBottom: 10 },
  appInfo: { flex: 1 },
  appName: { fontSize: 16, fontWeight: 'bold' },
  appStatus: { fontSize: 12, fontWeight: 'bold', marginTop: 5 },
  appActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { width: 35, height: 35, borderRadius: 17.5, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  actionIcon: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  subtext: { color: '#999', fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', padding: 30, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  linkText: { marginVertical: 20, fontSize: 16, textAlign: 'center', textDecorationLine: 'underline' }
});
