import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ChatsListScreen = () => {
  const navigation = useNavigation<any>();
  const [chats, setChats] = useState<any[]>([]);
  const [role, setRole] = useState<'CLIENT' | 'MASTER'>('CLIENT');

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const uStr = await AsyncStorage.getItem('user');
      if (uStr) {
        const u = JSON.parse(uStr);
        setRole(u.role);
        
        if (u.role === 'CLIENT') {
          // Клієнт бачить ТІЛЬКИ чат з майстром
          setChats([{
            id: '1',
            appointmentId: `direct-${u.masterId}-${u.id}`, // Спільна кімната
            userName: 'Мій Майстер',
            avatar: 'https://via.placeholder.com/100x100.png',
            lastMessage: 'Написати майстру...',
            time: 'Зараз',
            unreadCount: 0
          }]);
        } else {
          // Майстер
          try {
            const api = require('../api/client').default;
            const res = await api.get('/api/master/appointments');
            const apps = res.data || [];
            const uniqueClients = new Map();
            for (const app of apps) {
                if (app.client) {
                    uniqueClients.set(app.clientId, app.client);
                }
            }
            const chatsData = Array.from(uniqueClients.values()).map((client: any) => ({
                id: client.id,
                appointmentId: `direct-${u.id}-${client.id}`,
                userName: client.name || 'Клієнт ' + client.id.substring(0,4),
                avatar: client.avatarUrl || 'https://via.placeholder.com/100x100.png',
                lastMessage: 'Відкрити чат...',
                time: 'Зараз',
                unreadCount: 0
            }));
            setChats(chatsData);
          } catch(e) {
            console.log(e);
          }
        }
      }
    } catch(e) {}
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.chatListItem} 
      onPress={() => navigation.navigate('ChatScreen', { appointmentId: item.appointmentId })}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.userName}>{item.userName}</Text>
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
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Повідомлення</Text>
      <FlatList 
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#333', padding: 20, paddingTop: 60, paddingBottom: 10, backgroundColor: '#fff' },
  chatListItem: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderRadius: 20, marginBottom: 15, alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#FF69B4' },
  timeText: { fontSize: 12, color: '#999' },
  chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { flex: 1, fontSize: 14, color: '#666', marginRight: 10 },
  badge: { backgroundColor: '#FF1493', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});
