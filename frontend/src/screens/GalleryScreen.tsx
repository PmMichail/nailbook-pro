import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, Dimensions, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useRoute } from '@react-navigation/native';
import api from '../api/client';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { requireAuth } from '../utils/authCheck';

const { width } = Dimensions.get('window');

type TabType = 'ALL' | 'MY' | 'FAV';

export const GalleryScreen = () => {
  const route = useRoute();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const isGuest = (route.params as any)?.isGuest || false;
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [role, setRole] = useState<'MASTER' | 'CLIENT'>('CLIENT');

  // Check auth for guest mode - only for MY and FAV tabs
  useEffect(() => {
    if (isGuest && (activeTab === 'MY' || activeTab === 'FAV')) {
      requireAuth({ replace: (screen: string) => console.log('Navigate to', screen) } as any, 'Для перегляду особистої галереї необхідно увійти або зареєструватися');
    }
  }, [isGuest, activeTab]);

  // Upload modal state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [uploadTags, setUploadTags] = useState<string>('');
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Full-screen Image Viewer Modal
  const [viewerModalVisible, setViewerModalVisible] = useState(false);
  const [viewerImageUri, setViewerImageUri] = useState<string | null>(null);

  useEffect(() => {
    checkRole();
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [activeTab]);

  const checkRole = async () => {
    try {
      const uStr = await AsyncStorage.getItem('user');
      if (uStr) {
        const u = JSON.parse(uStr);
        setRole(u.role);
      }
    } catch(e) {}
  };

  const fetchGallery = async () => {
    // Don't fetch for guests on MY and FAV tabs
    if (isGuest && (activeTab === 'MY' || activeTab === 'FAV')) {
      setImages([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      let endpoint = '/api/gallery';
      if (activeTab === 'MY') {
        const uStr = await AsyncStorage.getItem('user');
        if (uStr) {
           const masterId = JSON.parse(uStr).id;
           endpoint = `/api/gallery/master/${masterId}`;
        }
      } else if (activeTab === 'FAV') {
        endpoint = '/api/gallery/favorites';
      }
      
      const res = await api.get(endpoint);
      setImages(res.data || []);
    } catch(e) {
      console.log('Fetch error', e);
    }
    setLoading(false);
  };

  const handleLike = async (id: string, currentlyLiked: boolean = false) => {
    try {
      if (activeTab === 'FAV') {
          // If in FAV tab, clicking un-favorites it
          await api.delete(`/api/gallery/${id}/like`);
      } else {
          // Default post to like
          await api.post(`/api/gallery/${id}/like`, {});
          Alert.alert('Успіх', t('gallery.addedToFav', {defaultValue: 'Додано в обране ❤️'}));
      }
      fetchGallery();
    } catch(e: any) {
      if (e.response?.status === 400 && activeTab !== 'FAV') {
          // Assume already liked and they want to unlike
          await api.delete(`/api/gallery/${id}/like`);
          fetchGallery();
      } else {
          Alert.alert('Помилка', 'Не вдалося зберегти');
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/gallery/${id}`);
      Alert.alert('Успіх', 'Фото видалено');
      fetchGallery();
    } catch(e) {
      Alert.alert('Помилка');
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Помилка", "Додаток потребує доступ до галереї!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setSelectedImageUri(result.assets[0].uri);
      setUploadTags('');
      setUploadModalVisible(true);
    }
  };

  const submitPhoto = async () => {
    if (!selectedImageUri) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: selectedImageUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);

      const parsedTags = uploadTags.split(/[\\s,]+/).filter(t => t.length > 0).map(t => t.startsWith('#') ? t : `#${t}`);
      formData.append('tags', JSON.stringify(parsedTags));
      formData.append('isPublic', isPublic.toString());

      await api.post(`/api/gallery`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      Alert.alert('Успіх', 'Роботу додано до галереї!');
      setUploadModalVisible(false);
      setSelectedImageUri(null);
      fetchGallery(); 
    } catch(e: any) {
      console.log('Upload error:', e);
      Alert.alert('Помилка', e.response?.data?.error || 'Не вдалося завантажити фото');
    }
    setUploading(false);
  };

  const renderItem = ({ item }: any) => (
    <View style={[styles.imageCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: item.isLocked ? 0.6 : 1 }]}>
      <TouchableOpacity 
        onPress={() => {
           if (item.isLocked) {
               Alert.alert('Обмеження LITE', 'Це фото заблоковано через ліміт безкоштовного тарифу (макс. 5 фото). Придбайте PRO для безліміту.');
               return;
           }
           setViewerImageUri(item.imageUrl);
           setViewerModalVisible(true);
        }} 
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.image} blurRadius={item.isLocked ? 10 : 0} />
        {item.isLocked && (
            <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)'}}>
                <Text style={{fontSize: 40}}>🔒</Text>
            </View>
        )}
      </TouchableOpacity>
      <View style={styles.imageFooter}>
        <TouchableOpacity disabled={item.isLocked} onPress={() => handleLike(item.id)} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.likes, { color: item.isLocked ? '#888' : '#C88D7A' }]}>❤️ {item.likesNum || 0} {activeTab === 'FAV' && '(Видалити)'}</Text>
        </TouchableOpacity>
        <View style={styles.tagsContainer}>
          {item.tags?.map((t: string, idx: number) => (
            <Text key={idx} style={styles.tagText}>{t}</Text>
          ))}
        </View>
      </View>
      
      {role === 'MASTER' && (
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.kicker}>NAILS</Text>
        <Text style={[styles.header, { color: colors.text }]}>{t('gallery.galleryTitle', {defaultValue: 'Галерея'})}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Портфоліо робіт, ідеї для клієнтів і обране.</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'ALL' && styles.tabActive]} onPress={() => setActiveTab('ALL')}>
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive, { color: activeTab === 'ALL' ? colors.primary : colors.textSecondary }]}>{t('gallery.allWorks', {defaultValue: 'Всі Роботи'})}</Text>
        </TouchableOpacity>

        {role === 'MASTER' && (
          <TouchableOpacity style={[styles.tab, activeTab === 'MY' && styles.tabActive]} onPress={() => setActiveTab('MY')}>
            <Text style={[styles.tabText, activeTab === 'MY' && styles.tabTextActive, { color: activeTab === 'MY' ? colors.primary : colors.textSecondary }]}>{t('gallery.myPortfolio', {defaultValue: 'Мої Портфоліо'})}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.tab, activeTab === 'FAV' && styles.tabActive]} onPress={() => setActiveTab('FAV')}>
          <Text style={[styles.tabText, activeTab === 'FAV' && styles.tabTextActive, { color: activeTab === 'FAV' ? colors.primary : colors.textSecondary }]}>{t('gallery.favorites', {defaultValue: 'Обране ❤️'})}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
         <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={images}
          keyExtractor={item => item.id || Math.random().toString()}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 50, color: colors.textSecondary}}>Немає фотографій</Text>}
        />
      )}
      
      {role === 'MASTER' && (
        <TouchableOpacity style={styles.fabBtn} onPress={pickImage}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      {/* Upload Modal */}
      <Modal visible={uploadModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Нова робота</Text>
            {selectedImageUri && <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />}
            
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border }]} 
              placeholder="Додайте теги (#френч, дизайн)" 
              placeholderTextColor={colors.textSecondary}
              value={uploadTags}
              onChangeText={setUploadTags}
            />

            <TouchableOpacity 
              style={{flexDirection: 'row', alignItems: 'center', marginBottom: 20, width: '100%'}} 
              onPress={() => setIsPublic(!isPublic)}>
               <View style={[styles.checkbox, isPublic && styles.checkboxActive]} />
               <Text style={{color: colors.text, marginLeft: 10, flex: 1}}>Показати в загальній галереї додатку</Text>
            </TouchableOpacity>

            {uploading ? (
               <ActivityIndicator size="large" color={colors.primary} style={{marginVertical: 15}} />
            ) : (
              <TouchableOpacity style={styles.btnPrimary} onPress={submitPhoto}>
                <Text style={styles.btnPrimaryText}>Завантажити</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.btnCancel} onPress={() => setUploadModalVisible(false)}>
              <Text style={styles.btnCancelText}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
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
  heroCard: { borderRadius: 28, borderWidth: 1, padding: 22, marginBottom: 16, shadowColor: '#C88D7A', shadowOffset: {width: 0, height: 12}, shadowOpacity: 0.1, shadowRadius: 22, elevation: 4 },
  kicker: { color: '#C88D7A', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  header: { fontSize: 32, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 21 },
  tabContainer: { flexDirection: 'row', marginBottom: 15, paddingHorizontal: 5, gap: 8 },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: 'transparent', borderRadius: 18 },
  tabActive: { backgroundColor: '#F3E7E2', borderColor: '#C88D7A' },
  tabText: { fontSize: 16, fontWeight: 'bold' },
  tabTextActive: { },
  imageCard: { width: (width / 2) - 17, marginHorizontal: 5, marginBottom: 15, borderRadius: 22, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.07, shadowRadius: 18, elevation: 4, borderWidth: 1 },
  image: { width: '100%', height: 180, resizeMode: 'cover' },
  imageFooter: { padding: 10, alignItems: 'flex-start' },
  likes: { color: '#C88D7A', fontWeight: 'bold', marginBottom: 5 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tagText: { color: '#fff', backgroundColor: '#e0c0b4', fontSize: 10, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, marginRight: 3, marginBottom: 3, overflow: 'hidden' },
  deleteBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: 5, borderRadius: 15 },
  deleteIcon: { fontSize: 16 },
  fabBtn: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#C88D7A', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5 },
  fabIcon: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', borderRadius: 20, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  previewImage: { width: '100%', height: 200, borderRadius: 15, marginBottom: 15, resizeMode: 'cover' },
  input: { width: '100%', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 20 },
  btnPrimary: { backgroundColor: '#C88D7A', width: '100%', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 10 },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnCancel: { padding: 10 },
  btnCancelText: { color: '#999', fontSize: 16 },
  viewerBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  viewerCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  viewerCloseText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  viewerImage: { width: '100%', height: '80%' },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: '#C88D7A', borderRadius: 4 },
  checkboxActive: { backgroundColor: '#C88D7A' }
});
