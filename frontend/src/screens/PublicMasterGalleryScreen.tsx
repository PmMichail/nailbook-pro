import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, ActivityIndicator, Dimensions } from 'react-native';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export const PublicMasterGalleryScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { masterId, masterName } = route.params || {};

  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewerModalVisible, setViewerModalVisible] = useState(false);
  const [viewerImageUri, setViewerImageUri] = useState<string | null>(null);

  useEffect(() => {
    fetchGallery();
  }, [masterId]);

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
      <Text style={[styles.header, { color: colors.text }]}>Роботи майстра: {masterName}</Text>
      
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
  container: { flex: 1, padding: 10 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, paddingHorizontal: 5 },
  imageCard: { width: (width / 2) - 15, marginHorizontal: 5, marginBottom: 15, borderRadius: 15, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2, borderWidth: 1 },
  image: { width: '100%', height: 180, resizeMode: 'cover' },
  imageFooter: { padding: 10, alignItems: 'flex-start' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tagText: { color: '#fff', backgroundColor: '#FFB6C1', fontSize: 10, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, marginRight: 3, marginBottom: 3, overflow: 'hidden' },
  viewerBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  viewerCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  viewerCloseText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  viewerImage: { width: '100%', height: '80%' },
  requestBtn: { position: 'absolute', bottom: 30, left: 20, right: 20, padding: 15, backgroundColor: '#FF69B4', borderRadius: 15, elevation: 5, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.3, shadowRadius: 5 },
  requestBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }
});
