import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ImageBackground, RefreshControl } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const ClientCalendarScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const [selectedDay, setSelectedDay] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [masterId, setMasterId] = useState<string | null>(null);
  const [masterName, setMasterName] = useState<string>('ПРОСТІР КРАСИ');
  const [prices, setPrices] = useState<any[]>([]);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const floatAnim = useRef(new Animated.Value(-150)).current; 
  const [floatMsg, setFloatMsg] = useState('');

  useEffect(() => {
    loadMasterId();
  }, []);

  const loadMasterId = async () => {
    try {
      const uStr = await AsyncStorage.getItem('user');
      if (uStr) {
        const u = JSON.parse(uStr);
        setMasterId(u.masterId);
        if (u.masterId) {
            const masterRes = await api.get(`/api/client/master/${u.masterId}`);
            if (masterRes.data && masterRes.data.name) {
                setMasterName('МАЙСТЕР ' + masterRes.data.name.toUpperCase());
            }
        }
      }
    } catch(e) {}
  };

  useEffect(() => {
    if (selectedDay && masterId) {
      fetchAvailableSlots();
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
      }
    } catch(e) {}
  };

  const fetchAvailableSlots = async () => {
    try {
      const res = await api.get(`/api/client/calendar/${masterId}?date=${selectedDay}`);
      setAvailableSlots(res.data.slots || []);
    } catch(e) {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMasterId();
    if (masterId) await fetchPrices();
    if (masterId && selectedDay) await fetchAvailableSlots();
    setRefreshing(false);
  };

  let toastTimeout: any;
  const showToast = (msg: string) => {
      setFloatMsg(msg);
      Animated.spring(floatAnim, {
          toValue: 70,
          useNativeDriver: true,
      }).start();

      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
          Animated.timing(floatAnim, {
              toValue: -150,
              duration: 300,
              useNativeDriver: true
          }).start();
      }, 3000);
  };

  const handleBook = async () => {
    if (!masterId) return showToast('Помилка: Майстер не прив\'язаний.');
    if (!selectedDay || !selectedSlot) return showToast('Будь ласка, оберіть дату та час.');

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
      showToast('Запис успішно створено!');
      fetchAvailableSlots(); 
      setSelectedSlot(null);
    } catch(e: any) {
      showToast(e.response?.data?.error || 'Помилка бронювання');
    }
  };

  const markedDates: any = {};
  if (selectedDay) {
    markedDates[selectedDay] = { selected: true, selectedColor: colors.primary, selectedTextColor: '#fff' };
  }

  const selectedPriceObj = prices.find(x => x.id === selectedPriceId);
  const displayPrice = selectedPriceObj ? selectedPriceObj.price : '0';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.brandTitle, { color: colors.text }]}>NAILSBOOK PRO</Text>
        <View style={[styles.avatarHolder, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={{fontSize: 16}}>💅</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        
        {/* Hero Section */}
        <View style={styles.heroSection}>
            <Text style={[styles.overTitle, { color: colors.primary }]}>{masterName}</Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Створіть свій</Text>
            <Text style={[styles.heroTitle, { color: colors.primary }]}>Стиль</Text>
            <Text style={[styles.heroDesc, { color: colors.textSecondary, borderLeftColor: colors.primary }]}>Оберіть послугу та зручний час для вашого ідеального візиту.</Text>
        </View>

        {/* Services / Rituals */}
        <View style={{marginBottom: 40}}>
            {prices.map((p, index) => {
                const isSelected = selectedPriceId === p.id;
                
                return (
                    <TouchableOpacity 
                        key={p.id} 
                        activeOpacity={0.9}
                        onPress={() => setSelectedPriceId(p.id)}
                        style={[
                            styles.serviceWrapper, 
                            { borderColor: isSelected ? colors.primary : colors.border }
                        ]}
                    >
                        <ImageBackground 
                            source={require('../../assets/gradient.jpg')} 
                            style={styles.gradientBg}
                            imageStyle={{ borderRadius: 12, opacity: 0.9 }}
                        >
                        <View style={[styles.serviceContent, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)', flex: 1, padding: 20, borderRadius: 12 }]}>
                            <View>
                                <Text style={[styles.serviceType, { color: colors.primary }]}>ПОСЛУГА</Text>
                                <Text style={[styles.serviceTitle, { color: colors.text }]}>{p.service}</Text>
                            </View>
                            <View style={{alignItems: 'flex-end'}}>
                                <Text style={[styles.servicePrice, { color: colors.text }]}>{p.price} ₴</Text>
                                <View style={[styles.addBtn, { borderColor: colors.primary, backgroundColor: isSelected ? colors.primary : 'transparent' }]}>
                                    <Text style={[styles.addBtnIcon, { color: isSelected ? '#fff' : colors.primary }]}>{isSelected ? '✓' : '+'}</Text>
                                </View>
                            </View>
                        </View>
                        </ImageBackground>
                    </TouchableOpacity>
                );
            })}
        </View>

        {/* Temporal Selection */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Вибір Дати</Text>
        <View style={[styles.calendarContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                    textSectionTitleColor: colors.textSecondary,
                    selectedDayBackgroundColor: colors.primary,
                    selectedDayTextColor: '#fff',
                    todayTextColor: colors.primary,
                    dayTextColor: colors.text,
                    textDisabledColor: colors.border,
                    arrowColor: colors.primary,
                    monthTextColor: colors.text,
                    textMonthFontWeight: 'bold',
                    textMonthFontFamily: 'serif',
                    textDayFontFamily: 'sans-serif'
                }}
            />
        </View>

        {/* Available Hours */}
        {selectedDay !== '' && (
            <View style={{marginBottom: 40}}>
                <Text style={[styles.sectionHeader, { color: colors.text }]}>Доступні години</Text>
                {availableSlots.length === 0 ? (
                    <Text style={{color: colors.textSecondary}}>Немає вільних віконець на цю дату.</Text>
                ) : (
                    <View style={styles.slotsGrid}>
                        {availableSlots.map((s, i) => {
                            const isSelected = selectedSlot === s;
                            return (
                                <TouchableOpacity 
                                    key={i} 
                                    onPress={() => setSelectedSlot(s)}
                                    style={[
                                        styles.slotBtn, 
                                        { borderColor: colors.border },
                                        isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                >
                                    <Text style={[styles.slotTxt, { color: isSelected ? '#fff' : colors.text }]}>{s}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                )}
            </View>
        )}

        {/* Note */}
        <View style={[styles.noteBox, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
            <Text style={[styles.noteTitle, { color: colors.text }]}>Правила візиту:</Text>
            <Text style={[styles.noteDesc, { color: colors.textSecondary }]}>Будь ласка, приходьте вчасно. У разі запізнення або неможливості прийти — завчасно попередьте майстра у чаті.</Text>
        </View>

        <View style={{height: 180}} />
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
          <BlurView intensity={70} tint={isDark ? "dark" : "light"} style={[styles.fabBlur, { borderColor: colors.border }]}>
              <TouchableOpacity style={styles.fabBtn} onPress={handleBook}>
                  <Text style={[styles.fabText, { color: colors.text }]}>ЗАБРОНЮВАТИ ВІЗИТ</Text>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Text style={[styles.fabPrice, { color: colors.primary }]}>{displayPrice} ₴</Text>
                      <Text style={[styles.fabArrow, { color: colors.primary }]}>→</Text>
                  </View>
              </TouchableOpacity>
          </BlurView>
      </View>

      <Animated.View style={[styles.toastContainer, { transform: [{ translateY: floatAnim }] }]}>
          <View style={[styles.toastBox, { backgroundColor: colors.primary }]}>
              <Text style={styles.toastTxt}>{floatMsg}</Text>
          </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { position: 'absolute', top: 0, width: '100%', zIndex: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 15 },
  brandTitle: { fontFamily: 'serif', fontSize: 16, letterSpacing: 2, fontStyle: 'italic', fontWeight: 'bold' },
  avatarHolder: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  
  scrollContent: { paddingTop: 130, paddingHorizontal: 24 },
  
  heroSection: { marginBottom: 40 },
  overTitle: { fontSize: 10, letterSpacing: 3, marginBottom: 15, fontWeight: 'bold' },
  heroTitle: { fontSize: 40, fontFamily: 'serif', fontStyle: 'italic', lineHeight: 46 },
  heroDesc: { fontSize: 13, marginTop: 20, lineHeight: 22, borderLeftWidth: 2, paddingLeft: 15 },

  serviceWrapper: { borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  gradientBg: { minHeight: 140, borderRadius: 12, overflow: 'hidden' },
  serviceContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  serviceType: { fontSize: 10, letterSpacing: 2, marginBottom: 5, fontWeight: 'bold' },
  serviceTitle: { fontSize: 24, fontFamily: 'serif', fontStyle: 'italic' },
  servicePrice: { fontSize: 18, fontFamily: 'serif', marginBottom: 10, fontWeight: 'bold' },
  addBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  addBtnIcon: { fontSize: 18 },

  sectionHeader: { fontSize: 26, fontFamily: 'serif', fontStyle: 'italic', marginBottom: 20 },
  
  calendarContainer: { borderRadius: 12, padding: 10, borderWidth: 1, marginBottom: 40 },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  slotBtn: { width: '48%', paddingVertical: 15, borderWidth: 1, marginBottom: 10, alignItems: 'center', borderRadius: 8 },
  slotTxt: { fontSize: 14, fontWeight: '600' },

  noteBox: { padding: 24, borderRadius: 12, borderLeftWidth: 4 },
  noteTitle: { fontFamily: 'serif', fontStyle: 'italic', fontSize: 20, marginBottom: 10 },
  noteDesc: { fontSize: 13, lineHeight: 20 },

  fabContainer: { position: 'absolute', bottom: 30, left: 24, right: 24, borderRadius: 16, overflow: 'hidden' },
  fabBlur: { borderWidth: 1, borderRadius: 16 },
  fabBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  fabText: { fontSize: 12, letterSpacing: 2, fontWeight: 'bold' },
  fabPrice: { fontWeight: 'bold', fontSize: 16, marginRight: 10 },
  fabArrow: { fontSize: 20, fontWeight: 'bold' },

  toastContainer: { position: 'absolute', top: 50, left: 24, right: 24, alignItems: 'center', zIndex: 100 },
  toastBox: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 10 },
  toastTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});
