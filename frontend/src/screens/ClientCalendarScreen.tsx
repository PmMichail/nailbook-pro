import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Animated, ImageBackground, Dimensions } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import api from '../api/client';

const { width } = Dimensions.get('window');

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const ClientCalendarScreen = () => {
  const [selectedDay, setSelectedDay] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [masterId, setMasterId] = useState<string | null>(null);
  const [prices, setPrices] = useState<any[]>([]);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);

  // Animations
  const floatAnim = useRef(new Animated.Value(100)).current; 
  const [floatMsg, setFloatMsg] = useState('');

  const scaleAnimBtn = useRef(new Animated.Value(1)).current;

  // Scale references for services
  const scaleServices = useRef<Record<string, Animated.Value>>({});

  useEffect(() => {
    loadMasterId();
  }, []);

  const loadMasterId = async () => {
    try {
      const uStr = await AsyncStorage.getItem('user');
      if (uStr) {
        const u = JSON.parse(uStr);
        setMasterId(u.masterId);
      }
    } catch(e) {}
  };

  useEffect(() => {
    if (selectedDay && masterId) {
      fetchAvailableSlots();
      showToast(`🗓 Обрана дата: ${selectedDay}`);
    }
  }, [selectedDay, masterId]);

  useEffect(() => {
    if (masterId) {
       fetchPrices();
    }
  }, [masterId]);

  const fetchPrices = async () => {
    try {
      const res = await api.get(`/api/client/masters/${masterId}/prices`);
      setPrices(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedPriceId(res.data[0].id);
        res.data.forEach((p: any) => {
            scaleServices.current[p.id] = new Animated.Value(1);
        });
      }
    } catch(e) {}
  };

  const fetchAvailableSlots = async () => {
    try {
      const res = await api.get(`/api/client/calendar/${masterId}?date=${selectedDay}`);
      setAvailableSlots(res.data.slots || []);
    } catch(e) {}
  };

  let toastTimeout: any;
  const showToast = (msg: string) => {
      setFloatMsg(msg);
      Animated.spring(floatAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 8
      }).start();

      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
          Animated.timing(floatAnim, {
              toValue: 150,
              duration: 300,
              useNativeDriver: true
          }).start();
      }, 3000);
  };

  const handleBookPressIn = () => {
      Animated.spring(scaleAnimBtn, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handleBookPressOut = () => {
      Animated.spring(scaleAnimBtn, { toValue: 1, useNativeDriver: true, bounciness: 10 }).start();
      handleBook();
  };

  const handleServicePress = (p: any) => {
      setSelectedPriceId(p.id);
      showToast(`💅 Обрано послугу: ${p.service}`);
      if (scaleServices.current[p.id]) {
          Animated.sequence([
              Animated.timing(scaleServices.current[p.id], { toValue: 1.02, duration: 100, useNativeDriver: true }),
              Animated.timing(scaleServices.current[p.id], { toValue: 1, duration: 100, useNativeDriver: true })
          ]).start();
      }
  };

  const handleBook = async () => {
    if (!masterId) return showToast('❌ Не прив\'язаний майстер');
    if (!selectedDay || !selectedSlot) return showToast('❌ Оберіть дату та час');

    try {
      let serviceData = {};
      if (selectedPriceId) {
         const p = prices.find(x => x.id === selectedPriceId);
         if (p) serviceData = { service: p.service, price: p.price };
      }

      await api.post(`/api/client/appointments`, {
        masterId,
        date: selectedDay,
        time: selectedSlot,
        ...serviceData
      });
      showToast('✨ Запис створено! ✨');
      fetchAvailableSlots(); 
      setSelectedSlot(null);
    } catch(e: any) {
      showToast(`❌ ${e.response?.data?.error || 'Помилка запису'}`);
    }
  };

  const markedDates: any = {};
  if (selectedDay) {
    markedDates[selectedDay] = { selected: true, selectedColor: '#F5CFBC', selectedTextColor: '#5D2E1E' };
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
            <View>
                <Text style={styles.brandTitle}>NailsBook Pro</Text>
                <Text style={styles.subtitle}>💅 Преміум запис</Text>
            </View>
            <View style={styles.avatarPlaceholder}>
                <Text style={{fontSize: 24}}>✨</Text>
            </View>
        </View>

        <View style={[styles.card, styles.gridOutline]}>
            <Text style={styles.sectionTitle}>Розклад</Text>
            <Calendar
                current={new Date().toISOString().split('T')[0]}
                minDate={new Date().toISOString().split('T')[0]}
                onDayPress={(day: any) => {
                    setSelectedDay(day.dateString);
                    setSelectedSlot(null);
                }}
                markedDates={markedDates}
                theme={{
                    calendarBackground: 'transparent',
                    textSectionTitleColor: '#C29A86',
                    selectedDayBackgroundColor: '#F5CFBC',
                    selectedDayTextColor: '#5D2E1E',
                    todayTextColor: '#C47A5C',
                    dayTextColor: '#4A3630',
                    textDisabledColor: '#D9BFB2',
                    arrowColor: '#D9A48B',
                    monthTextColor: '#5B3E32',
                    textMonthFontWeight: 'bold',
                    textDayFontWeight: '500',
                    textDayHeaderFontWeight: '500'
                }}
            />
        </View>

        {prices.length > 0 && (
            <View style={{marginTop: 10, marginBottom: 20}}>
                <Text style={styles.smallHeading}>✨ Оберіть послугу</Text>
                {prices.map((p) => {
                    const isSelected = selectedPriceId === p.id;
                    const scale = scaleServices.current[p.id] || new Animated.Value(1);
                    return (
                        <AnimatedTouchable 
                            key={p.id} 
                            activeOpacity={0.9}
                            onPress={() => handleServicePress(p)}
                            style={[
                                styles.serviceCard, 
                                isSelected && styles.serviceCardSelected,
                                { transform: [{ scale }] }
                            ]}
                        >
                            <Text style={styles.serviceName}>{p.service}</Text>
                            <Text style={styles.servicePrice}>{p.price} ₴</Text>
                        </AnimatedTouchable>
                    );
                })}
            </View>
        )}

        {selectedDay !== '' && (
            <View style={{marginBottom: 20}}>
                <Text style={styles.smallHeading}>⏱ Доступний час</Text>
                {availableSlots.length === 0 ? (
                    <Text style={{color: '#999', paddingLeft: 5}}>Немає вільних віконець</Text>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{paddingVertical: 10}}>
                        {availableSlots.map((s, i) => {
                            const isSelected = selectedSlot === s;
                            return (
                                <TouchableOpacity 
                                    key={i} 
                                    onPress={() => setSelectedSlot(s)}
                                    style={[styles.timeSlotBtn, isSelected && styles.timeSlotSelected]}
                                >
                                    <Text style={[styles.timeSlotTxt, isSelected && styles.timeSlotTxtSelected]}>{s}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                )}
            </View>
        )}

        <Animated.View style={{ transform: [{ scale: scaleAnimBtn }], marginTop: 10, marginBottom: 50 }}>
            <TouchableOpacity 
                activeOpacity={1}
                onPressIn={handleBookPressIn}
                onPressOut={handleBookPressOut}
            >
                <LinearGradient 
                    colors={['#F2C5B0', '#E6AD92']} 
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.bookBtn}
                >
                    <Text style={styles.bookBtnTxt}>💎 Записатися</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>

      </ScrollView>

      <Animated.View style={[styles.toastContainer, { transform: [{ translateY: floatAnim }] }]}>
          <BlurView intensity={70} tint="light" style={styles.toastBlur}>
              <Text style={styles.toastTxt}>{floatMsg}</Text>
          </BlurView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F5' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, marginTop: 10 },
  brandTitle: { fontSize: 26, fontWeight: 'bold', color: '#B97F6A', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: '#B98D7A', marginTop: 4 },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#F7E3D9', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  
  card: { backgroundColor: 'rgba(255, 255, 255, 0.92)', borderRadius: 32, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 5 },
  gridOutline: { borderWidth: 1, borderColor: '#F4BE96', backgroundColor: '#FFF8F2' },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#5B3E32', marginBottom: 15 },
  
  smallHeading: { fontSize: 18, fontWeight: '600', marginBottom: 16, letterSpacing: -0.2, color: '#2E2A28' },
  
  serviceCard: { backgroundColor: '#fff', padding: 16, borderRadius: 28, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: 'rgba(255,200,170,0.2)' },
  serviceCardSelected: { backgroundColor: '#FFF4EE', shadowOpacity: 0.08, borderColor: '#F3C9B6' },
  serviceName: { fontWeight: '500', fontSize: 16, color: '#2E2A28' },
  servicePrice: { fontWeight: 'bold', color: '#C47A5C', fontSize: 17 },

  timeSlotBtn: { backgroundColor: '#fff', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 20, marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,200,170,0.3)', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5 },
  timeSlotSelected: { backgroundColor: '#F5CFBC', borderColor: '#F5CFBC' },
  timeSlotTxt: { color: '#4A3630', fontWeight: 'bold', fontSize: 15 },
  timeSlotTxtSelected: { color: '#5D2E1E' },

  bookBtn: { borderRadius: 60, paddingVertical: 18, alignItems: 'center', shadowColor: '#BE6446', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  bookBtnTxt: { color: '#3E2A22', fontSize: 18, fontWeight: 'bold', letterSpacing: -0.2 },

  toastContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, borderRadius: 60, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  toastBlur: { paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  toastTxt: { color: '#6C4232', fontWeight: 'bold', fontSize: 15 }
});
