import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, RefreshControl, Image } from 'react-native';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
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
  const [refreshing, setRefreshing] = useState(false);
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
  const [priceForm, setPriceForm] = useState({ service: '', price: '', imageUrl: '' as string | null });

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmApp, setConfirmApp] = useState<any>(null);
  const [confirmPrice, setConfirmPrice] = useState('');
  const [confirmNote, setConfirmNote] = useState('');
  const [confirmPrepayment, setConfirmPrepayment] = useState('');

  const [payCard, setPayCard] = useState('');
  const [payBank, setPayBank] = useState('');
  const [payLink, setPayLink] = useState('');

  const statusMap: any = {
    'PENDING': 'ОЧІКУЄ ПІДТВЕРДЖЕННЯ',
    'AWAITING_PREPAYMENT': 'ОЧІКУЄ ПЕРЕДОПЛАТУ',
    'CONFIRMED': 'ПІДТВЕРДЖЕНО',
    'CANCELLED': 'СКАСОВАНО',
    'COMPLETED': 'ВИКОНАНО'
  };

  const loadAllData = async () => {
    await Promise.all([
      fetchProfile(),
      fetchSettings(),
      fetchSlots(),
      fetchAppointments(),
      fetchPrices(),
      fetchPaymentInfo()
    ]);
  };

  useEffect(() => {
    loadAllData();
  }, [selectedCalendarDay]);

  const onRefresh = useCallback(async () => {
      setRefreshing(true);
      await loadAllData();
      setRefreshing(false);
  }, [selectedCalendarDay]);

  const fetchPaymentInfo = async () => {
    // Moved to PaymentSetupScreen
  };

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  const fetchProfile = async () => {
    try {
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
      let finalImageUrl = priceForm.imageUrl;
      if (priceForm.imageUrl && !priceForm.imageUrl.startsWith('http')) {
        const formData = new FormData();
        const ext = priceForm.imageUrl.split('.').pop() || 'jpg';
        formData.append('image', {
           uri: priceForm.imageUrl,
           name: `price-${Date.now()}.${ext}`,
           type: `image/${ext}`
        } as any);
        const uploadRes = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImageUrl = uploadRes.data.url;
      }

      if (editPriceId) {
         await api.put('/api/master/prices', { id: editPriceId, service: priceForm.service, price: parseInt(priceForm.price, 10), imageUrl: finalImageUrl });
      } else {
         await api.post('/api/master/prices', { service: priceForm.service, price: parseInt(priceForm.price, 10), imageUrl: finalImageUrl });
      }
      setPriceModalVisible(false);
      fetchPrices();
    } catch(e) { Alert.alert('Помилка', 'Не вдалося зберегти'); }
  };

  const handlePickPriceImage = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPriceForm({ ...priceForm, imageUrl: result.assets[0].uri });
      }
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

  const updateAppStatus = async (id: string, action: 'confirm' | 'cancel' | 'complete') => {
    try {
      if (action === 'cancel') {
         await api.put(`/api/master/appointments/${id}/cancel`);
         fetchAppointments();
      } else if (action === 'complete') {
         await api.put(`/api/master/appointments/${id}/complete`);
         Alert.alert('Успіх', 'Запис позначено як виконаний!');
         fetchAppointments();
      }
    } catch(e) {}
  };

  const submitConfirm = async () => {
    try {
      await api.put(`/api/master/appointments/${confirmApp.id}/confirm`, {
         price: confirmPrice ? parseInt(confirmPrice, 10) : undefined,
         note: confirmNote,
         prepaymentRequired: Boolean(confirmPrepayment),
         prepaymentAmount: confirmPrepayment ? parseInt(confirmPrepayment, 10) : 0
      });
      setConfirmModalVisible(false);
      fetchAppointments();
      fetchSlots(); // in case status changed wait time etc
    } catch(e) {
      Alert.alert('Помилка', 'Неможливо підтвердити');
    }
  };

  // savePaymentDetails is moved to PaymentSetupScreen

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
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={[styles.header, { color: colors.text }]}>
        {masterProfile?.salonName ? `Салон ${masterProfile.salonName}` : (masterProfile?.name ? `Майстер ${masterProfile.name}` : 'Дашборд')}
      </Text>
      
      {/* Top Actions */}
      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20}}>
        <TouchableOpacity style={[styles.btnPrimary, {flex: 1, marginRight: 5, backgroundColor: colors.primary}]} onPress={() => setQrModalVisible(true)}>
          <Text style={[styles.btnPrimaryText, { color: isDark ? '#000' : '#fff' }]}>QR Код</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnSecondary, {flex: 0.5, borderColor: colors.primary}]} onPress={() => navigation.navigate('StatisticsScreen' as never)}>
          <Text style={{color: colors.primary, fontWeight: 'bold'}}>Статист.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnSecondary, {flex: 0.5, marginLeft: 5, borderColor: colors.primary}]} onPress={() => navigation.navigate('PaymentSetupScreen' as never)}>
          <Text style={{color: colors.primary, fontWeight: 'bold'}}>Оплата</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.btnSecondary, {marginBottom: 20, width: '100%', borderColor: colors.primary}]} onPress={() => navigation.navigate('MasterClientsScreen' as never)}>
          <Text style={{color: colors.primary, fontWeight: 'bold', fontSize: 16}}>👥 Мої Клієнти</Text>
      </TouchableOpacity>


      {/* Settings Form for Weekly */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.primary }]}>Налаштування Графіка</Text>

        <View style={styles.daysRow}>
          {DAYS.map((day, ix) => (
            <TouchableOpacity 
              key={ix} 
              style={[styles.dayCircle, { width: 45, height: 45, borderRadius: 22.5, borderColor: colors.primary }, activeEditDay === ix + 1 && { backgroundColor: colors.primary }]}
              onPress={() => setActiveEditDay(ix + 1)}
            >
              <Text style={{ color: activeEditDay === ix + 1 ? (isDark ? '#000' : '#fff') : colors.text, fontSize: 12, fontWeight: 'bold' }}>{day}</Text>
              <Text style={{ color: activeEditDay === ix + 1 ? (isDark ? '#000' : '#fff') : colors.textSecondary, fontSize: 10 }}>{currentWeek[ix]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={{marginBottom: 15}}
          onPress={() => handleUpdateCurrentDaySetting('isWorking', !activeDaySetting.isWorking)}
        >
          <Text style={{color: colors.text, fontWeight: 'bold'}}>
            {activeDaySetting.isWorking ? '✅ Робочий день' : '❌ Вихідний'} <Text style={{color: colors.textSecondary, fontSize: 12}}>(Натисніть щоб змінити)</Text>
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

        <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: colors.primary }]} onPress={saveSettings}>
          <Text style={[styles.btnPrimaryText, { color: isDark ? '#000' : '#fff' }]}>Зберегти Розклад</Text>
        </TouchableOpacity>
      </View>

      {/* Slots Grid */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
          <TouchableOpacity onPress={() => changeDay(-1)} style={{padding: 5}}><Text style={{fontSize: 20, color: colors.primary}}>◀</Text></TouchableOpacity>
          <Text style={[styles.cardTitle, { color: colors.primary, marginBottom: 0 }]}>{selectedCalendarDay}</Text>
          <TouchableOpacity onPress={() => changeDay(1)} style={{padding: 5}}><Text style={{fontSize: 20, color: colors.primary}}>▶</Text></TouchableOpacity>
        </View>
        {loading ? <ActivityIndicator color={colors.primary} /> : (
            <View style={styles.slotsGrid}>
                {slots.map((s, i) => {
                    let bgColor = isDark ? 'rgba(46, 139, 87, 0.4)' : '#e6ffe6'; // Green for available
                    let txtColor = isDark ? '#fff' : '#111';
                    let displayIcon = '';
                    if (s.isBlocked) {
                        bgColor = isDark ? '#333' : '#e0e0e0';
                        txtColor = colors.textSecondary;
                        displayIcon = '🔒';
                    } else if (s.appointment) {
                        bgColor = isDark ? 'rgba(139, 0, 0, 0.5)' : '#ffe6e6'; 
                        txtColor = isDark ? '#ffcccc' : '#8b0000';
                        displayIcon = '👤';
                    }

                    return (
                        <TouchableOpacity key={i} style={[styles.slotBtn, { backgroundColor: bgColor }]} onPress={() => {
                            if (!s.appointment) toggleSlotBlock(s);
                        }}>
                            <Text style={[styles.slotBtnText, { color: txtColor }]}>{s.time} {displayIcon}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        )}
      </View>



      {/* Appointments */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>⚠️ Запити на підтвердження</Text>
        {appointments.filter((a: any) => a.status === 'PENDING').length === 0 && <Text style={[styles.subtext, {color: colors.textSecondary}]}>Немає нових запитів</Text>}
        {appointments.filter((a: any) => a.status === 'PENDING').map((app: any) => (
            <View key={'pend-'+app.id} style={[styles.appointmentItem, {borderBottomColor: colors.border, backgroundColor: isDark ? 'rgba(224, 192, 180, 0.1)' : 'rgba(224, 192, 180, 0.2)', padding: 15, borderRadius: 12}]}>
                <View style={styles.appInfo}>
                    <TouchableOpacity onPress={() => setSelectedClient(app)}>
                      <Text style={[styles.appName, {color: colors.primary, fontWeight: 'bold', fontFamily: 'serif'}]}>
                        Клієнт: {app.client?.name || app.client?.phone || app.clientId.substring(0,6)}
                      </Text>
                    </TouchableOpacity>
                    <Text style={[{color: colors.textSecondary, fontSize: 12, marginVertical: 3}]}>
                      Дата: {new Date(app.date).toISOString().split('T')[0]} о {app.time}
                    </Text>
                </View>
                <View style={styles.appActions}>
                    <TouchableOpacity style={[styles.actionBtn, {borderColor: '#2e8b57', borderWidth: 1}]} onPress={() => {
                        setConfirmApp(app);
                        setConfirmPrice(app.price ? app.price.toString() : '');
                        setConfirmNote('');
                        setConfirmPrepayment('');
                        setConfirmModalVisible(true);
                    }}>
                        <Text style={[styles.actionIcon, { color: '#2e8b57' }]}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, {borderColor: '#8b0000', borderWidth: 1}]} onPress={() => updateAppStatus(app.id, 'cancel')}>
                        <Text style={[styles.actionIcon, { color: '#8b0000' }]}>✗</Text>
                    </TouchableOpacity>
                </View>
            </View>
        ))}

        <Text style={[styles.cardTitle, {marginTop: 20, color: colors.text}]}>Сьогоднішні записи (або обраний день)</Text>
        {currentDayAppoints.filter((a) => a.status !== 'PENDING').length === 0 && <Text style={[styles.subtext, {color: colors.textSecondary}]}>Немає записів</Text>}
        {currentDayAppoints.filter((a) => a.status !== 'PENDING').map((app: any) => (
            <View key={app.id} style={[styles.appointmentItem, {borderBottomColor: colors.border}]}>
                <View style={styles.appInfo}>
                    <TouchableOpacity onPress={() => setSelectedClient(app)}>
                      <Text style={[styles.appName, {color: colors.text, fontWeight: 'bold', fontFamily: 'serif'}]}>
                        Клієнт: {app.client?.name || app.client?.phone || app.clientId.substring(0,6)}
                      </Text>
                    </TouchableOpacity>
                    <Text style={[{color: colors.textSecondary, fontSize: 12, marginVertical: 3}]}>
                      Дата: {new Date(app.date).toISOString().split('T')[0]} о {app.time}
                    </Text>
                    <Text style={[styles.appStatus, app.status === 'CONFIRMED' && {color: '#2e8b57'}, app.status === 'CANCELLED' && {color: '#8b0000'}]}>
                      {statusMap[app.status] || app.status}
                    </Text>
                </View>
                <View style={styles.appActions}>
                    {(app.status === 'CONFIRMED' || app.status === 'AWAITING_PREPAYMENT') && (
                        <TouchableOpacity style={[styles.actionBtn, {borderColor: colors.primary, borderWidth: 1, backgroundColor: colors.primary}]} onPress={() => updateAppStatus(app.id, 'complete')}>
                            <Text style={[styles.actionIcon, { color: isDark ? '#000' : '#fff' }]}>✓</Text>
                        </TouchableOpacity>
                    )}
                    {app.status !== 'CANCELLED' && app.status !== 'COMPLETED' && (
                        <TouchableOpacity style={[styles.actionBtn, {borderColor: '#8b0000', borderWidth: 1}]} onPress={() => updateAppStatus(app.id, 'cancel')}>
                            <Text style={[styles.actionIcon, { color: '#8b0000' }]}>✗</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.actionBtn, {borderColor: colors.textSecondary, borderWidth: 1}]} onPress={() => {
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
                        <Text style={[styles.actionIcon, { color: colors.textSecondary }]}>🚫</Text>
                    </TouchableOpacity>
                </View>
            </View>
        ))}
      </View>

      {/* Прайс-лист */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.primary }]}>Мої ціни (Прайс-лист)</Text>
        {prices.map(item => (
          <View key={item.id} style={[styles.row, {marginBottom: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10}]}>
            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl.startsWith('http') ? item.imageUrl : `${api.defaults.baseURL}/${item.imageUrl}` }} style={{ width: 40, height: 40, borderRadius: 8, marginRight: 10 }} />
            )}
            <Text style={{color: colors.text, flex: 1}}>{item.service}: {item.price} грн</Text>
            <TouchableOpacity onPress={() => { setEditPriceId(item.id); setPriceForm({service: item.service, price: item.price.toString(), imageUrl: item.imageUrl}); setPriceModalVisible(true); }} style={{marginRight: 15, padding: 5, borderWidth: 1, borderColor: colors.border, borderRadius: 8}}>
               <Text style={{color: colors.text}}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deletePriceItem(item.id)} style={{padding: 5, borderWidth: 1, borderColor: colors.border, borderRadius: 8}}>
               <Text style={{color: colors.text}}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={[styles.btnPrimary, {marginTop: 10, backgroundColor: colors.primary}]} onPress={() => { setEditPriceId(null); setPriceForm({service: '', price: '', imageUrl: null}); setPriceModalVisible(true); }}>
           <Text style={[styles.btnPrimaryText, { color: isDark ? '#000' : '#fff' }]}>+ Додати послугу</Text>
        </TouchableOpacity>
      </View>

      {/* Client Details Modal */}
      <Modal visible={!!selectedClient} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>Деталі запису</Text>
            <Text style={{color: colors.text, marginBottom: 5}}>Ім'я: {selectedClient?.client?.name || 'Без імені'}</Text>
            <Text style={{color: colors.text, marginBottom: 5}}>Телефон: {selectedClient?.client?.phone || 'Приховано'}</Text>
            <Text style={{color: colors.text, marginBottom: 5}}>Послуга: {selectedClient?.service || 'Не вказано'}</Text>
            <Text style={{color: colors.text, marginBottom: 15}}>Ціна: {selectedClient?.price ? selectedClient.price + ' грн' : 'Не вказано'}</Text>
            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: colors.primary }]} onPress={() => setSelectedClient(null)}>
              <Text style={[styles.btnPrimaryText, { color: isDark ? '#000' : '#fff' }]}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Price Edit Modal */}
      <Modal visible={priceModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>Редагувати послугу</Text>

             <TouchableOpacity style={styles.imageUploadBtn} onPress={handlePickPriceImage}>
                 {priceForm.imageUrl ? (
                     <Image source={{uri: priceForm.imageUrl.startsWith('http') ? priceForm.imageUrl : (priceForm.imageUrl.includes('/') ? `${api.defaults.baseURL}/${priceForm.imageUrl}` : priceForm.imageUrl)}} style={{width: 100, height: 100, borderRadius: 15}} />
                 ) : (
                     <View style={[styles.imagePlaceholder, {borderColor: colors.border}]}>
                         <Text style={{color: '#888', textAlign: 'center', fontWeight: 'bold'}}>📷 Фото (Опц.)</Text>
                     </View>
                 )}
             </TouchableOpacity>

            <View style={{width: '100%', marginBottom: 10}}>
                <Text style={[styles.label, {color: colors.textSecondary}]}>Назва послуги:</Text>
                <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border, width: '100%'}]} placeholder="Манікюр..." placeholderTextColor="#666" value={priceForm.service} onChangeText={t => setPriceForm({...priceForm, service: t})} />
            </View>
            <View style={{width: '100%', marginBottom: 15}}>
                <Text style={[styles.label, {color: colors.textSecondary}]}>Ціна (грн):</Text>
                <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border, width: '100%'}]} placeholder="450" placeholderTextColor="#666" keyboardType="numeric" value={priceForm.price} onChangeText={t => setPriceForm({...priceForm, price: t})} />
            </View>
            <TouchableOpacity style={[styles.btnPrimary, {marginBottom: 10, width: '100%', backgroundColor: colors.primary }]} onPress={savePriceItem}>
              <Text style={[styles.btnPrimaryText, { color: isDark ? '#000' : '#fff' }]}>Зберегти</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnSecondary, {width: '100%', borderColor: colors.primary}]} onPress={() => setPriceModalVisible(false)}>
              <Text style={{color: colors.primary, fontWeight: 'bold'}}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirm Appointment Modal */}
      <Modal visible={confirmModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>Підтвердити запис</Text>
            <Text style={{color: colors.textSecondary, marginBottom: 10, textAlign: 'center'}}>Ви можете змінити ціну або залишити базову. Також можна додати примітку.</Text>
            
            <View style={{width: '100%', marginBottom: 10}}>
                <Text style={[styles.label, {color: colors.textSecondary}]}>Нова ціна (грн) - опціонально:</Text>
                <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border}]} placeholder="Введіть суму" placeholderTextColor="#666" keyboardType="numeric" value={confirmPrice} onChangeText={setConfirmPrice} />
            </View>

            <View style={{width: '100%', marginBottom: 15}}>
                <Text style={[styles.label, {color: colors.textSecondary}]}>Примітка клієнту (необов'язково):</Text>
                <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border, height: 80}]} placeholder="Коментар..." placeholderTextColor="#666" multiline value={confirmNote} onChangeText={setConfirmNote} />
            </View>

            {/* PREPAYMENT */}
            <View style={{width: '100%', marginBottom: 15}}>
                <Text style={[styles.label, {color: colors.textSecondary}]}>Передоплата (PRO):</Text>
                <TextInput style={[styles.input, {color: colors.text, borderColor: colors.border}]} placeholder="Сума передоплати (напр. 200) або пусто" placeholderTextColor="#666" keyboardType="numeric" value={confirmPrepayment} onChangeText={setConfirmPrepayment} />
                <Text style={{fontSize: 10, color: colors.textSecondary}}>Якщо вказано, запис скасується через 3 год без оплати.</Text>
            </View>

            <TouchableOpacity style={[styles.btnPrimary, {marginBottom: 10, width: '100%', backgroundColor: colors.primary }]} onPress={submitConfirm}>
              <Text style={[styles.btnPrimaryText, { color: isDark ? '#000' : '#fff' }]}>Підтвердити</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnSecondary, {width: '100%', borderColor: colors.primary}]} onPress={() => setConfirmModalVisible(false)}>
              <Text style={{color: colors.primary, fontWeight: 'bold'}}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={qrModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}]}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>Ваше посилання</Text>
            <View style={{padding: 10, backgroundColor: '#fff', borderRadius: 10}}>
                <QRCode value={inviteLink} size={200} />
            </View>
            <Text style={[styles.linkText, {color: colors.primary}]} onPress={copyLink}>{inviteLink}</Text>
            
            <TouchableOpacity style={[styles.btnSecondary, {borderColor: colors.primary, width: '100%'}]} onPress={() => Alert.alert('Купон', 'Ваш клієнт може використати код: ' + masterProfile?.linkSlug + ' при реєстрації, щоб отримати сертифікат!')}>
              <Text style={{color: colors.primary, fontWeight: 'bold', textAlign: 'center'}}>Надіслати як Купон</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnPrimary, {marginTop: 15, width: '100%', backgroundColor: colors.primary }]} onPress={() => setQrModalVisible(false)}>
              <Text style={[styles.btnPrimaryText, { color: isDark ? '#000' : '#fff' }]}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{height: 100}}/>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  header: { fontSize: 24, fontFamily: 'serif', fontStyle: 'italic', marginBottom: 20 },
  card: { borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, borderWidth: 1 },
  cardTitle: { fontSize: 18, fontFamily: 'serif', fontStyle: 'italic', fontWeight: 'bold', marginBottom: 15 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dayCircle: { width: 35, height: 35, borderRadius: 17.5, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 13, marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 15, fontSize: 16 },
  btnPrimary: { borderRadius: 12, padding: 15, alignItems: 'center' },
  btnPrimaryText: { fontWeight: 'bold', fontSize: 14 },
  btnSecondary: { backgroundColor: 'transparent', borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1 },
  imageUploadBtn: { alignSelf: 'center', marginBottom: 15 },
  imagePlaceholder: { width: 100, height: 100, borderRadius: 15, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  slotBtn: { padding: 15, borderRadius: 10, margin: 5, width: '45%', alignItems: 'center' },
  slotBtnText: { fontWeight: 'bold' },
  appointmentItem: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, paddingBottom: 10, marginBottom: 10 },
  appInfo: { flex: 1 },
  appName: { fontSize: 16 },
  appStatus: { fontSize: 10, fontWeight: 'bold', marginTop: 5 },
  appActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { width: 35, height: 35, borderRadius: 17.5, justifyContent: 'center', alignItems: 'center', marginLeft: 10, backgroundColor: 'transparent' },
  actionIcon: { fontSize: 16, fontWeight: 'bold' },
  subtext: { fontSize: 13, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', padding: 24, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontFamily: 'serif', fontStyle: 'italic', marginBottom: 20 },
  linkText: { marginVertical: 20, fontSize: 14, textAlign: 'center', textDecorationLine: 'underline' }
});
