import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, ActivityIndicator, Dimensions, Linking, Alert } from 'react-native';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireAuth } from '../utils/authCheck';

const { width } = Dimensions.get('window');

export const PublicMasterGalleryScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { masterId, masterName, isGuest } = route.params || {};
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewerModalVisible, setViewerModalVisible] = useState(false);
  const [viewerImageUri, setViewerImageUri] = useState<string | null>(null);
  
  const [masterInfo, setMasterInfo] = useState<any>(null);

  useEffect(() => {
    if (masterId) {
      fetchGallery();
      fetchMasterInfo();
    }
  }, [masterId]);

  const fetchMasterInfo = async () => {
    try {
      const res = await api.get(`/api/client/master/${masterId}`);
      if (res.data) setMasterInfo(res.data);
    } catch (e) {}
  };

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/gallery/master/${masterId}`);
      setImages(res.data || []);
    } catch (e) {
      console.log('Error fetching raw gallery', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCode = async () => {
      // Check auth for guest mode
      if (isGuest) {
          return requireAuth(navigation, 'Для запиту коду підключення необхідно увійти або зареєструватися');
      }
      
      try {
          const userStr = await AsyncStorage.getItem('user');
          if (!userStr) return;
          const user = JSON.parse(userStr);
          
          // Generate deterministic room ID
          const roomId = [user.id, masterId].sort().join('_');
          
          // Pre-send the system message
          const msgText = "Добрий день! Я знайшла вас через пошук поруч. Мені дуже сподобалися ваші роботи! Будь ласка, надішліть мені свій персональний код підключення для запису.";
          
          await api.post(`/api/chats/${roomId}/messages`, {
              text: msgText,
              imageUrl: null
          });

          // Navigate to Chat
          navigation.navigate('ChatsListNav', {
              screen: 'ChatScreen',
              params: {
                  roomId,
                  receiverId: masterId,
                  receiverName: masterName
              }
          });
      } catch (e) {
          console.error(e);
      }
  };

  const normalizeSocialUrl = (value: string, platform: 'instagram' | 'tiktok' | 'facebook') => {
    const clean = value.trim();
    if (!clean) return null;
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
    const handle = clean.replace(/^@/, '').replace(/^\/+/, '');
    if (platform === 'instagram') return `https://instagram.com/${handle}`;
    if (platform === 'tiktok') return `https://tiktok.com/@${handle}`;
    return `https://facebook.com/${handle}`;
  };

  const openSocial = (value: string, platform: 'instagram' | 'tiktok' | 'facebook') => {
    const url = normalizeSocialUrl(value, platform);
    if (url) Linking.openURL(url);
  };

  const renderItem = ({ item }: any) => (
    <View style={[styles.imageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity 
        onPress={() => {
           setViewerImageUri(item.imageUrl);
           setViewerModalVisible(true);
        }} 
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      </TouchableOpacity>
      <View style={styles.imageFooter}>
        <View style={styles.tagsContainer}>
          {item.tags?.map((t: string, idx: number) => (
            <Text key={idx} style={styles.tagText}>{t}</Text>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.kicker}>PORTFOLIO</Text>
        <Text style={[styles.header, { color: colors.text }]}>{masterName}</Text>
        <Text style={[styles.heroText, { color: colors.textSecondary }]}>Ніжні роботи, адреса салону та соцмережі майстра.</Text>
        {masterInfo && (
          <View style={styles.infoBlock}>
            <Text style={[styles.infoText, { color: colors.text }]}>📍 {masterInfo.city || 'Місто не вказано'}{masterInfo.address ? ` • ${masterInfo.address}` : ' • Адресу ще не вказано'}</Text>
          </View>
        )}
        {masterInfo && (masterInfo.instagram || masterInfo.tiktok || masterInfo.facebook) ? (
          <View style={styles.socialRow}>
            {!!masterInfo.instagram && (
              <TouchableOpacity style={styles.socialBtn} onPress={() => openSocial(masterInfo.instagram, 'instagram')}>
                 <Text style={styles.socialText}>Instagram</Text>
              </TouchableOpacity>
            )}
            {!!masterInfo.tiktok && (
              <TouchableOpacity style={styles.socialBtn} onPress={() => openSocial(masterInfo.tiktok, 'tiktok')}>
                 <Text style={styles.socialText}>TikTok</Text>
              </TouchableOpacity>
            )}
            {!!masterInfo.facebook && (
              <TouchableOpacity style={styles.socialBtn} onPress={() => openSocial(masterInfo.facebook, 'facebook')}>
                 <Text style={styles.socialText}>Facebook</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={[styles.noSocialText, { color: colors.textSecondary }]}>Соцмережі майстра ще не додані</Text>
        )}
      </View>
      
      {loading ? (
         <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={images}
          keyExtractor={item => item.id || Math.random().toString()}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: 150 }}
          ListEmptyComponent={
              <Text style={{textAlign: 'center', marginTop: 50, color: colors.textSecondary}}>
                  У майстра поки немає фотографій
              </Text>
          }
        />
      )}

      <TouchableOpacity style={styles.requestBtn} onPress={handleRequestCode}>
          <Text style={styles.requestBtnText}>💬 Запросити код підключення</Text>
      </TouchableOpacity>

      <Modal visible={viewerModalVisible} animationType="fade" transparent={true} onRequestClose={() => setViewerModalVisible(false)}>
        <View style={styles.viewerBg}>
          <TouchableOpacity style={styles.viewerCloseBtn} onPress={() => setViewerModalVisible(false)}>
            <Text style={styles.viewerCloseText}>✕</Text>
          </TouchableOpacity>
          {viewerImageUri && <Image source={{ uri: viewerImageUri }} style={styles.viewerImage} resizeMode="contain" />}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  heroCard: { borderRadius: 34, borderWidth: 1, padding: 24, marginBottom: 18, shadowColor: '#D6A99A', shadowOffset: {width: 0, height: 18}, shadowOpacity: 0.16, shadowRadius: 28, elevation: 5 },
  kicker: { color: '#C88D7A', fontSize: 12, fontWeight: '900', letterSpacing: 2.5, marginBottom: 8 },
  header: { fontSize: 32, fontWeight: '900', marginBottom: 8 },
  heroText: { fontSize: 14, lineHeight: 22, marginBottom: 14 },
  infoBlock: { backgroundColor: '#FFF7F3', borderColor: '#F0D4C8', borderWidth: 1, borderRadius: 20, padding: 12, marginBottom: 12 },
  infoText: { fontSize: 13, fontWeight: '700', lineHeight: 19 },
  imageCard: { width: (width / 2) - 17, marginHorizontal: 5, marginBottom: 15, borderRadius: 24, overflow: 'hidden', shadowColor: '#C88D7A', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.12, shadowRadius: 20, elevation: 4, borderWidth: 1 },
  image: { width: '100%', height: 180, resizeMode: 'cover' },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  socialBtn: { backgroundColor: '#F3E7E2', borderWidth: 1, borderColor: '#E0C0B4', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  socialText: { color: '#7A3E2F', fontSize: 13, fontWeight: '900' },
  noSocialText: { fontSize: 13, fontStyle: 'italic' },
  imageFooter: { padding: 10, alignItems: 'flex-start' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tagText: { color: '#fff', backgroundColor: '#e0c0b4', fontSize: 10, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, marginRight: 3, marginBottom: 3, overflow: 'hidden' },
  viewerBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  viewerCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  viewerCloseText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  viewerImage: { width: '100%', height: '80%' },
  requestBtn: { position: 'absolute', bottom: 30, left: 20, right: 20, padding: 16, backgroundColor: '#C88D7A', borderRadius: 24, elevation: 6, shadowColor: '#C88D7A', shadowOffset: {width:0, height:12}, shadowOpacity: 0.28, shadowRadius: 22 },
  requestBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }
});
