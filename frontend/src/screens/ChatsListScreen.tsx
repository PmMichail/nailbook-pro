import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';

export const ChatsListScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { colors, isDark } = useTheme();
  
  const [chats, setChats] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = async () => {
    try {
      const uStr = await AsyncStorage.getItem('user');
      if (uStr) {
        const currentUser = JSON.parse(uStr);
        // Fetch actual chats from backend
        const res = await api.get('/api/chats');
        const activeChats = res.data || [];
        
        const chatsData = activeChats.map((chat: any) => {
            const lastMsg = chat.messages && chat.messages.length > 0 ? chat.messages[0].text : 'Відкрити чат...';
            // Extract other user from enriched property
            const otherUser = chat.otherUser || {};
            
            // Fallback logically if backend not yet pushed to Render
            let fallbackName = 'Співрозмовник';
            if (currentUser.role === 'MASTER' && lastMsg.includes('Майстер код')) fallbackName = 'Новий клієнт (за запитом)';
            
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
                avatar: otherUser.avatarUrl || 'https://via.placeholder.com/100x100.png',
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

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.chatListItem, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={() => navigation.navigate('ChatScreen', { roomId: item.roomId, receiverName: item.userName })}
    >
      <Image source={{ uri: item.avatar }} style={[styles.avatar, { borderColor: colors.border, borderWidth: 1 }]} />
      
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
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.headerTitle, { backgroundColor: colors.card, color: colors.text, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>Повідомлення</Text>
      
      <FlatList 
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15 }}
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
  headerTitle: { fontSize: 26, fontFamily: 'serif', fontStyle: 'italic', padding: 20, paddingTop: 60, paddingBottom: 15 },
  chatListItem: { flexDirection: 'row', padding: 15, borderRadius: 16, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, borderWidth: 1 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  userName: { fontSize: 18, fontFamily: 'serif', fontWeight: 'bold' },
  chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { flex: 1, fontSize: 14, marginRight: 10 },
  badge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 12, fontWeight: 'bold' }
});
