import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { requireAuth } from '../utils/authCheck';

const { width } = Dimensions.get('window');

export const FavoritesScreen = () => {
  const route = useRoute();
  const { colors } = useTheme();
  const isGuest = (route.params as any)?.isGuest || false;
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check auth for guest mode
  useEffect(() => {
    if (isGuest) {
      requireAuth({ replace: (screen: string) => console.log('Navigate to', screen) } as any, 'Для перегляду обраного необхідно увійти або зареєструватися');
    }
  }, [isGuest]);

  useEffect(() => {
    if (!isGuest) {
      loadFavorites();
    }
  }, [isGuest]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/gallery/favorites');
      setItems(res.data || []);
    } catch (e) {
      Alert.alert('Помилка', 'Не вдалося завантажити обране');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      await api.delete(`/api/gallery/${id}/like`);
      setItems(prev => prev.filter(x => x.id !== id));
    } catch (e) {
      Alert.alert('Помилка', 'Не вдалося видалити з обраного');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.imageContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Image source={{ uri: item.imageUrl || item.url }} style={styles.image} />
      <View style={styles.overlay}>
        <View style={styles.actionBtn}>
          <Text style={{ fontSize: 16 }}>❤️</Text>
          <Text style={styles.actionText}>{item.likesNum || item.likes || 0}</Text>
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={() => removeFavorite(item.id)}>
          <Text style={{ fontSize: 16 }}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.kicker}>SAVED IDEAS</Text>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Збережене</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Ваші улюблені дизайни для наступного візиту.</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList 
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>В обраному поки немає фото</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  heroCard: { marginTop: 50, borderRadius: 28, borderWidth: 1, padding: 22, marginBottom: 16, shadowColor: '#C88D7A', shadowOffset: {width: 0, height: 12}, shadowOpacity: 0.1, shadowRadius: 22, elevation: 4 },
  kicker: { color: '#C88D7A', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  headerTitle: { fontSize: 32, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 21 },
  row: { justifyContent: 'space-between', marginBottom: 15 },
  imageContainer: { width: (width / 2) - 18, aspectRatio: 1, borderRadius: 22, overflow: 'hidden', borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.07, shadowRadius: 18, elevation: 4 },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: 'rgba(0,0,0,0.3)' },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: '#fff', marginLeft: 5, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 15 }
});
