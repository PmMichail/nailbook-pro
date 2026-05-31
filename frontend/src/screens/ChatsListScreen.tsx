import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { requireAuth } from '../utils/authCheck';

export const ChatsListScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const isFocused = useIsFocused();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const isGuest = route?.params?.isGuest || false;
  
  const [chats, setChats] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Check auth for guest mode
  useEffect(() => {
    if (isGuest) {
      requireAuth(navigation, 'Для перегляду чатів необхідно увійти або зареєструватися');
    }
  }, [isGuest]);

  const loadChats = async () => {
    try {
      const uStr = await AsyncStorage.getItem('user');
      if (uStr) {
        const currentUser = JSON.parse(uStr);
        // Fetch actual chats from backend
        const res = await api.get('/api/chats');
        const activeChats = res.data || [];
        
        const chatsData = activeChats.map((chat: any) => {
            const lastMsg = chat.messages && chat.messages.length > 0 ? chat.messages[0].text : 'Почати чат...';
            // Extract other user from enriched property
            const otherUser = chat.otherUser || {};
            
            // Fallback logically if backend not yet pushed to Render
            let fallbackName = 'Співрозмовник';
            if (currentUser.role === 'MASTER' && lastMsg && lastMsg.includes('Майстер код')) fallbackName = 'Новий клієнт (за запитом)';
            
            let displayTime = '';
            if (chat.messages && chat.messages.length > 0) {
                const dateObj = new Date(chat.messages[0].createdAt);
                
                const today = new Date();
                const yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);
                
                if (dateObj.toDateString() === today.toDateString()) {
                   displayTime = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                } else if (dateObj.toDateString() === yesterday.toDateString()) {
                   displayTime = 'Вчора';
                } else {
                   displayTime = dateObj.toLocaleDateString([], {day: 'numeric', month: 'short'});
                }
            }

            return {
                id: chat.id,
                roomId: chat.roomId,
                userName: otherUser.name || otherUser.salonName || otherUser.phone || fallbackName,
                avatar: otherUser.avatarUrl || '',
                lastMessage: lastMsg,
                time: displayTime,
                unreadCount: 0 
            };
        });
        
        setChats(chatsData);
      }
    } catch(e) {
        console.error("Error loading chats", e);
    }
  };

  useEffect(() => {
    if (isFocused) {
        loadChats();
    }
  }, [isFocused]);

  const onRefresh = useCallback(async () => {
      setRefreshing(true);
      await loadChats();
      setRefreshing(false);
  }, []);

  const deleteChat = async (chatId: string, userName: string) => {
    Alert.alert('Підтвердження', `Видалити чат з ${userName}?`, [
      { text: 'Скасувати', style: 'cancel' },
      { text: 'Видалити', style: 'destructive', onPress: async () => {
          try {
              await api.delete(`/api/chats/${chatId}`);
              setChats(prev => prev.filter(c => c.id !== chatId));
          } catch(e) {
              Alert.alert('Помилка', 'Не вдалося видалити чат');
          }
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.chatListItem, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={() => navigation.navigate('ChatScreen', { roomId: item.roomId, receiverName: item.userName })}
      onLongPress={() => deleteChat(item.id, item.userName)}
    >
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={[styles.avatar, { borderColor: colors.border, borderWidth: 1 }]} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Text style={{ color: colors.primary, fontWeight: '900' }}>NB</Text>
        </View>
      )}
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.userName, { color: colors.text }]}>{item.userName}</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.time}</Text>
        </View>
        <View style={styles.chatFooter}>
          <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: isDark ? '#000' : '#fff' }]}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.kicker}>MESSAGES</Text>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('chats.messages', {defaultValue: 'Повідомлення'})}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Ваші діалоги з клієнтами та майстрами.</Text>
      </View>
      
      <FlatList 
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        style={{ backgroundColor: colors.background }}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 50, color: colors.textSecondary, fontStyle: 'italic' }}>Немає активних чатів</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroCard: { margin: 15, marginTop: 55, borderRadius: 28, borderWidth: 1, padding: 22, shadowColor: '#C88D7A', shadowOffset: {width: 0, height: 12}, shadowOpacity: 0.1, shadowRadius: 22, elevation: 4 },
  kicker: { color: '#C88D7A', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  headerTitle: { fontSize: 32, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 21 },
  chatListItem: { flexDirection: 'row', padding: 16, borderRadius: 24, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.07, shadowRadius: 18, elevation: 4, borderWidth: 1 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  avatarFallback: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  userName: { fontSize: 18, fontFamily: 'serif', fontWeight: 'bold' },
  chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { flex: 1, fontSize: 14, marginRight: 10 },
  badge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 12, fontWeight: 'bold' }
});
