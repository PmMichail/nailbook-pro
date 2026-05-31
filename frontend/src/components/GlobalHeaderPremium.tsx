import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';
import api from '../api/client';
import { useUnread } from '../context/UnreadContext';
import { useTheme } from '../context/ThemeContext';

const masterMenuItems = [
  { label: 'Запис', screen: 'MasterCalendarScreen', icon: 'calendar-plus', color: '#C88D7A' },
  { label: 'Графік', screen: 'WorkHoursScreen', icon: 'clock', color: '#D6A99A' },
  { label: 'Прайс', screen: 'PriceListScreen', icon: 'tags', color: '#E8B4A8' },
  { label: 'Галерея', screen: 'GalleryScreen', icon: 'images', color: '#F0C8B8' },
  { label: 'Оплата QR', screen: 'PaymentSetupScreen', icon: 'qrcode', color: '#D6A99A' },
  { label: 'Статистика', screen: 'StatisticsScreen', icon: 'chart-line', color: '#C88D7A' }
];

const clientMenuItems = [
  { label: 'Календар', screen: 'Calendar', icon: 'calendar-alt', color: '#C88D7A' },
  { label: 'Мої записи', screen: 'Appointments', icon: 'clipboard-list', color: '#D6A99A' },
  { label: 'Чати', screen: 'ChatsListNav', icon: 'comments', color: '#E8B4A8' },
  { label: 'Галерея', screen: 'Gallery', icon: 'images', color: '#F0C8B8' },
  { label: 'Профіль', screen: 'Profile', icon: 'user', color: '#D6A99A' },
  { label: 'Обране', screen: 'Favorites', icon: 'heart', color: '#C88D7A' }
];

type Props = {
  mode?: 'master' | 'client';
  isGuest?: boolean;
};

export const GlobalHeaderPremium = ({ mode = 'client', isGuest = false }: Props) => {
  const [salonName, setSalonName] = useState('NailsBook Pro');
  const [salonLogo, setSalonLogo] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation();
  const { unreadCount } = useUnread();
  const { colors, isDark } = useTheme();
  const menuItems = mode === 'master' ? masterMenuItems : clientMenuItems;
  const animations = useRef(menuItems.map(() => new Animated.Value(0))).current;

  const baseUrl = useMemo(() => String(api.defaults.baseURL || '').replace(/\/$/, ''), []);

  useEffect(() => {
    if (!isGuest) {
      loadInfo();
      const interval = setInterval(loadInfo, 2000);
      return () => clearInterval(interval);
    }
  }, [isGuest]);

  useEffect(() => {
    if (menuVisible) {
      animations.forEach((anim) => anim.setValue(0));
      Animated.stagger(70, animations.map((anim) => Animated.spring(anim, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }))).start();
    }
  }, [menuVisible, animations]);

  const resolveLogo = (url?: string | null) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const loadInfo = async () => {
    try {
      const uStr = await AsyncStorage.getItem('user');
      if (!uStr) return;
      const u = JSON.parse(uStr);
      if (u.salonName) setSalonName(u.salonName);
      const ownLogo = resolveLogo(u.salonLogo || u.avatarUrl);
      if (ownLogo) {
        setSalonLogo(ownLogo);
        return;
      }
      if (u.masterId) {
        const masterRes = await api.get(`/api/client/master/${u.masterId}`);
        if (masterRes.data?.salonName) setSalonName(masterRes.data.salonName);
        const masterLogo = resolveLogo(masterRes.data?.salonLogo);
        if (masterLogo) setSalonLogo(masterLogo);
      }
    } catch (e) {}
  };

  const goTo = (screen: string) => {
    setMenuVisible(false);
    if (mode === 'master') {
      (navigation as any).navigate('MasterTabs', { screen: 'Dashboard', params: { screen } });
      return;
    }
    if (screen === 'Favorites') {
      (navigation as any).navigate('ClientTabs', { screen: 'Profile', params: { screen: 'Favorites' } });
      return;
    }
    (navigation as any).navigate('ClientTabs', { screen });
  };

  const goToChats = () => {
    (navigation as any).navigate(mode === 'master' ? 'MasterTabs' : 'ClientTabs', { screen: 'ChatsListNav' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}> 
      <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)} activeOpacity={0.85}>
        <Text style={[styles.menuGlyph, { color: colors.textSecondary }]}>≡</Text>
      </TouchableOpacity>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <BlurView intensity={38} tint={isDark ? 'dark' : 'light'} style={styles.blurWrap}>
            <Pressable style={[styles.panel, isDark ? styles.panelDark : styles.panelLight]}>
              <View style={styles.panelHeader}>
                <View>
                  <Text style={[styles.panelKicker, { color: colors.primary }]}>NAILSBOOK PRO</Text>
                  <Text style={[styles.panelTitle, { color: colors.text }]}>{mode === 'master' ? 'Меню майстра' : 'Меню клієнта'}</Text>
                </View>
                <TouchableOpacity style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' }]} onPress={() => setMenuVisible(false)}>
                  <Text style={[styles.closeText, { color: colors.text }]}>×</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.grid}>
                {menuItems.map((item, index) => {
                  const translateY = animations[index].interpolate({ inputRange: [0, 1], outputRange: [28, 0] });
                  return (
                    <Animated.View key={item.screen} style={[styles.cardWrap, { opacity: animations[index], transform: [{ translateY }] }]}>
                      <TouchableOpacity style={styles.menuCard} activeOpacity={0.86} onPress={() => goTo(item.screen)}>
                        <View style={[styles.iconBubble, { backgroundColor: `${item.color}22` }]}>
                          <FontAwesome name={item.icon} size={24} color={item.color} />
                        </View>
                        <Text style={[styles.cardText, { color: colors.text }]}>{item.label}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </Pressable>
          </BlurView>
        </Pressable>
      </Modal>

      <View style={styles.titleWrap}>
        <Text style={[styles.title, { color: colors.text }]}>{salonName.toUpperCase()}</Text>
      </View>

      <TouchableOpacity onPress={goToChats} style={styles.logoWrap}>
        {salonLogo ? <Image source={{ uri: salonLogo }} style={[styles.logo, { borderColor: colors.border }]} /> : <View style={[styles.placeholderLogo, { backgroundColor: colors.primary }]}><Text style={styles.placeholderText}>💅</Text></View>}
        {unreadCount > 0 && <View style={[styles.badge, { backgroundColor: colors.primary }]}><Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingTop: 55, paddingBottom: 15, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  menuButton: { marginRight: 15, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(200,141,122,0.12)' },
  menuGlyph: { fontSize: 27, fontWeight: '900', marginTop: -2 },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontFamily: 'serif', fontStyle: 'italic', letterSpacing: 2, fontWeight: 'bold' },
  logoWrap: { position: 'relative' },
  logo: { width: 40, height: 40, borderRadius: 20, borderWidth: 1 },
  placeholderLogo: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#fff', fontSize: 16 },
  badge: { position: 'absolute', right: -5, top: -5, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  overlay: { flex: 1, backgroundColor: 'rgba(8,16,20,0.28)', justifyContent: 'flex-start' },
  blurWrap: { marginTop: 86, marginHorizontal: 14, borderRadius: 28, overflow: 'hidden' },
  panelLight: { padding: 18, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)', backgroundColor: 'rgba(255,255,255,0.58)' },
  panelDark: { padding: 18, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(30,30,30,0.85)' },
  panel: { padding: 18, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)', backgroundColor: 'rgba(255,255,255,0.58)' },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  panelKicker: { fontSize: 11, letterSpacing: 2.5, color: '#C88D7A', fontWeight: '900' },
  panelTitle: { fontSize: 25, color: '#173B3F', fontWeight: '900', marginTop: 4 },
  closeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.72)', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 26, color: '#173B3F', marginTop: -2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardWrap: { width: '48%' },
  menuCard: { height: 118, borderRadius: 20, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  iconBubble: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cardText: { color: '#173B3F', fontSize: 14, fontWeight: '900', textAlign: 'center' }
});
