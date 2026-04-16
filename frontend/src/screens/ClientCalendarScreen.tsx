import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ImageBackground, Image } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api/client';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const ClientCalendarScreen = ({ navigation }: any) => {
  const [selectedDay, setSelectedDay] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [masterId, setMasterId] = useState<string | null>(null);
  const [prices, setPrices] = useState<any[]>([]);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);

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

  let toastTimeout: any;
  const showToast = (msg: string) => {
      setFloatMsg(msg);
      Animated.spring(floatAnim, {
          toValue: 20,
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
    if (!masterId) return showToast('Error: Master is not attached.');
    if (!selectedDay || !selectedSlot) return showToast('Please select a date and time.');

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
      showToast('Appointment successfully created!');
      fetchAvailableSlots(); 
      setSelectedSlot(null);
    } catch(e: any) {
      showToast(e.response?.data?.error || 'Booking error');
    }
  };

  const markedDates: any = {};
  if (selectedDay) {
    markedDates[selectedDay] = { selected: true, selectedColor: '#ffb2b6', selectedTextColor: '#3b0810' };
  }

  const selectedPriceObj = prices.find(x => x.id === selectedPriceId);
  const displayPrice = selectedPriceObj ? selectedPriceObj.price : '0';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <Text style={styles.menuIcon}>≡</Text>
        </TouchableOpacity>
        <Text style={styles.brandTitle}>NAILSBOOK PRO</Text>
        <View style={styles.avatarHolder}>
            <Text style={{fontSize: 16}}>👩‍🎨</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Hero Section */}
        <View style={styles.heroSection}>
            <Text style={styles.overTitle}>THE ART OF THE HAND</Text>
            <Text style={styles.heroTitle}>Curate Your</Text>
            <Text style={[styles.heroTitle, {color: '#e0c0b4'}]}>Signature</Text>
            <Text style={styles.heroDesc}>An immersive sanctuary where high-fashion editorial aesthetics meet the precision of master artistry. Choose your ritual.</Text>
        </View>

        {/* Services / Rituals */}
        <View style={{marginBottom: 40}}>
            {prices.map((p, index) => {
                const isSelected = selectedPriceId === p.id;
                // Alternate between the two generated images for aesthetics
                const imageSource = index % 2 === 0 
                  ? { uri: 'file:///Users/mac/.gemini/antigravity/brain/cdb6101d-9121-45b4-adb5-424ba6651236/hero_nail_1_1776342361589.png' }
                  : { uri: 'file:///Users/mac/.gemini/antigravity/brain/cdb6101d-9121-45b4-adb5-424ba6651236/hero_nail_2_1776342379323.png' };
                  
                return (
                    <TouchableOpacity 
                        key={p.id} 
                        activeOpacity={0.9}
                        onPress={() => setSelectedPriceId(p.id)}
                        style={[styles.serviceWrapper, isSelected && {borderColor: '#ffb2b6', borderWidth: 1}]}
                    >
                        <ImageBackground source={imageSource} style={styles.serviceImage} imageStyle={{opacity: 0.6}}>
                            <LinearGradient colors={['transparent', '#161212']} style={StyleSheet.absoluteFillObject} />
                            <View style={styles.serviceContent}>
                                <View>
                                    <Text style={styles.serviceType}>PREMIUM TREATMENT</Text>
                                    <Text style={styles.serviceTitle}>{p.service}</Text>
                                </View>
                                <View style={{alignItems: 'flex-end'}}>
                                    <Text style={styles.servicePrice}>${p.price}</Text>
                                    <View style={[styles.addBtn, isSelected && styles.addBtnSelected]}>
                                        <Text style={[styles.addBtnIcon, isSelected && {color: '#3b0810'}]}>{isSelected ? '✓' : '+'}</Text>
                                    </View>
                                </View>
                            </View>
                        </ImageBackground>
                    </TouchableOpacity>
                );
            })}
        </View>

        {/* Temporal Selection */}
        <Text style={styles.sectionHeader}>Temporal Selection</Text>
        <View style={styles.calendarContainer}>
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
                    textSectionTitleColor: '#a08c8c',
                    selectedDayBackgroundColor: '#ffb2b6',
                    selectedDayTextColor: '#3b0810',
                    todayTextColor: '#e0c0b4',
                    dayTextColor: '#eae0e0',
                    textDisabledColor: '#3d3838',
                    arrowColor: '#ffb2b6',
                    monthTextColor: '#eae0e0',
                    textMonthFontWeight: 'bold',
                    textMonthFontFamily: 'serif',
                    textDayFontFamily: 'sans-serif'
                }}
            />
        </View>

        {/* Available Hours */}
        {selectedDay !== '' && (
            <View style={{marginBottom: 40}}>
                <Text style={styles.sectionHeader}>Available Hours</Text>
                {availableSlots.length === 0 ? (
                    <Text style={{color: '#a08c8c'}}>No slots available for this date.</Text>
                ) : (
                    <View style={styles.slotsGrid}>
                        {availableSlots.map((s, i) => {
                            const isSelected = selectedSlot === s;
                            return (
                                <TouchableOpacity 
                                    key={i} 
                                    onPress={() => setSelectedSlot(s)}
                                    style={[styles.slotBtn, isSelected && styles.slotBtnSelected]}
                                >
                                    <Text style={[styles.slotTxt, isSelected && styles.slotTxtSelected]}>{s}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                )}
            </View>
        )}

        {/* Note */}
        <View style={styles.noteBox}>
            <Text style={styles.noteTitle}>Note from your artist:</Text>
            <Text style={styles.noteDesc}>Please arrive 10 minutes prior to your appointment for a sensory consultation. We provide complimentary espresso and chilled bordeaux upon arrival.</Text>
        </View>

        <View style={{height: 120}} />
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
          <BlurView intensity={40} tint="dark" style={styles.fabBlur}>
              <TouchableOpacity style={styles.fabBtn} onPress={handleBook}>
                  <Text style={styles.fabText}>BOOK APPOINTMENT</Text>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Text style={styles.fabPrice}>${displayPrice}.00</Text>
                      <Text style={styles.fabArrow}>→</Text>
                  </View>
              </TouchableOpacity>
          </BlurView>
      </View>

      <Animated.View style={[styles.toastContainer, { transform: [{ translateY: floatAnim }] }]}>
          <View style={styles.toastBox}>
              <Text style={styles.toastTxt}>{floatMsg}</Text>
          </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#161212' },
  header: { position: 'absolute', top: 0, width: '100%', zIndex: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 50, paddingBottom: 15, backgroundColor: 'rgba(22,18,18,0.9)' },
  menuIcon: { color: '#6B2D33', fontSize: 32 },
  brandTitle: { color: '#f5f5dc', fontFamily: 'serif', fontSize: 16, letterSpacing: 2, fontStyle: 'italic', fontWeight: 'bold' },
  avatarHolder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#393433', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(83,67,67,0.2)' },
  
  scrollContent: { paddingTop: 120, paddingHorizontal: 24 },
  
  heroSection: { marginBottom: 40 },
  overTitle: { color: '#ffb2b6', fontSize: 10, letterSpacing: 3, marginBottom: 15, fontWeight: 'bold' },
  heroTitle: { color: '#eae0e0', fontSize: 44, fontFamily: 'serif', fontStyle: 'italic', lineHeight: 46 },
  heroDesc: { color: '#d8c1c1', fontSize: 13, marginTop: 20, lineHeight: 22, borderLeftWidth: 1, borderLeftColor: '#6b2d33', paddingLeft: 15 },

  serviceWrapper: { height: 200, borderRadius: 8, overflow: 'hidden', marginBottom: 16, backgroundColor: '#1f1b1b' },
  serviceImage: { width: '100%', height: '100%', justifyContent: 'flex-end' },
  serviceContent: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  serviceType: { color: '#ffb2b6', fontSize: 10, letterSpacing: 2, marginBottom: 5 },
  serviceTitle: { color: '#eae0e0', fontSize: 24, fontFamily: 'serif', fontStyle: 'italic' },
  servicePrice: { color: '#e0c0b4', fontSize: 20, fontFamily: 'serif', marginBottom: 10 },
  addBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,178,182,0.3)', alignItems: 'center', justifyContent: 'center' },
  addBtnSelected: { backgroundColor: '#ffb2b6' },
  addBtnIcon: { color: '#ffb2b6', fontSize: 18 },

  sectionHeader: { color: '#eae0e0', fontSize: 28, fontFamily: 'serif', fontStyle: 'italic', marginBottom: 20 },
  
  calendarContainer: { backgroundColor: '#1f1b1b', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: 'rgba(83,67,67,0.3)', marginBottom: 40 },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  slotBtn: { width: '48%', paddingVertical: 15, borderWidth: 1, borderColor: 'rgba(83,67,67,0.3)', marginBottom: 10, alignItems: 'center', borderRadius: 4 },
  slotBtnSelected: { backgroundColor: 'rgba(107,45,51,0.2)', borderColor: '#ffb2b6' },
  slotTxt: { color: '#d8c1c1', fontSize: 13 },
  slotTxtSelected: { color: '#ffb2b6' },

  noteBox: { backgroundColor: 'rgba(57,52,51,0.4)', padding: 24, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#ffb2b6' },
  noteTitle: { color: '#eae0e0', fontFamily: 'serif', fontStyle: 'italic', fontSize: 20, marginBottom: 10 },
  noteDesc: { color: '#d8c1c1', fontSize: 13, lineHeight: 20 },

  fabContainer: { position: 'absolute', bottom: 30, left: 24, right: 24, borderRadius: 8, overflow: 'hidden' },
  fabBlur: { backgroundColor: 'rgba(22,18,18,0.7)', borderWidth: 1, borderColor: 'rgba(107,45,51,0.4)', borderRadius: 8 },
  fabBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  fabText: { color: '#f5f5dc', fontSize: 12, letterSpacing: 2, fontWeight: 'bold' },
  fabPrice: { color: '#ffb2b6', fontWeight: 'bold', fontSize: 16, marginRight: 10 },
  fabArrow: { color: '#ffb2b6', fontSize: 20 },

  toastContainer: { position: 'absolute', top: 50, left: 24, right: 24, alignItems: 'center', zIndex: 100 },
  toastBox: { backgroundColor: '#ffb2b6', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 10 },
  toastTxt: { color: '#3b0810', fontWeight: 'bold', fontSize: 14 }
});
