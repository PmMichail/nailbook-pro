import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';

export const ChatsListScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { colors } = useTheme();
  
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    if (isFocused) {
        loadChats();
    }
  }, [isFocused]);

  const loadChats = async () => {
    try {
      const uStr = await AsyncStorage.getItem('user');
      if (uStr) {
        // Fetch actual chats from backend
        const res = await api.get('/api/chats');
        const activeChats = res.data || [];
        
        const chatsData = activeChats.map((chat: any) => {
            const lastMsg = chat.messages && chat.messages.length > 0 ? chat.messages[0].text : 'Відкрити чат...';
            // Extract other user from enriched property
            const otherUser = chat.otherUser || {};
            
            return {
                id: chat.id,
                roomId: chat.roomId, // this is the dynamic room
                userName: otherUser.name || 'Анонім',
                avatar: otherUser.avatarUrl || 'https://via.placeholder.com/100x100.png',
                lastMessage: lastMsg,
                time: 'Зараз', // could be parsed from chat.messages[0].createdAt
                unreadCount: 0 // to be implemented if tracking isRead
            };
        });
        
        setChats(chatsData);
      }
    } catch(e) {
        console.error("Error loading chats", e);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.chatListItem, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={() => navigation.navigate('ChatScreen', { roomId: item.roomId, receiverName: item.userName })}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.userName, { color: colors.text }]}>{item.userName}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        <View style={styles.chatFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.headerTitle, { backgroundColor: colors.card, color: colors.text }]}>Повідомлення</Text>
      <FlatList 
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15 }}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 50, color: '#999' }}>Немає активних чатів</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, },
  headerTitle: { fontSize: 28, fontWeight: 'bold', padding: 20, paddingTop: 60, paddingBottom: 10 },
  chatListItem: { flexDirection: 'row', padding: 15, borderRadius: 20, marginBottom: 15, alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, borderWidth: 1 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  userName: { fontSize: 18, fontWeight: 'bold' },
  timeText: { fontSize: 12, color: '#999' },
  chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { flex: 1, fontSize: 14, color: '#666', marginRight: 10 },
  badge: { backgroundColor: '#FF1493', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});
