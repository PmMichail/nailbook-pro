import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, SafeAreaView, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const ChatScreen = ({ route }: any) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { appointmentId, roomId: paramRoomId, receiverName } = route.params || {};
  const roomId = paramRoomId || appointmentId || 'mock-123'; 
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('123');
  const [loading, setLoading] = useState(true);
  
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    let newSocket: Socket;

    const initConnection = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
           setCurrentUserId(JSON.parse(userStr).id);
        }

        newSocket = io(API_URL, {
          auth: { token: token }
        });

        newSocket.emit('join_chat', roomId);

        newSocket.on('new_message', (msg: any) => {
          setMessages(prev => [...prev, msg]);
        });

        // Load chat history
        try {
          const res = await api.get(`/api/chats/${roomId}/messages`);
          if (res.data && Array.isArray(res.data)) {
             setMessages(res.data);
          }
        } catch (e) {
          console.log('Error loading messages', e);
        }

        setSocket(newSocket);
        setLoading(false);
      } catch(e) {
        setLoading(false);
      }
    };
    initConnection();

    return () => {
      if (newSocket) {
        newSocket.off('new_message');
        newSocket.disconnect();
      }
    };
  }, [roomId]);

  const handleSend = () => {
    if (!inputText.trim() && !socket) return;
    socket!.emit('send_message', { roomId, text: inputText });
    setInputText('');
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      try {
        const localUri = result.assets[0].uri;
        const filename = localUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        const formData = new FormData();
        formData.append('photo', { uri: localUri, name: filename, type } as any);
        
        const uploadRes = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (uploadRes.data?.url) {
          socket!.emit('send_message', { roomId, imageUrl: uploadRes.data.url });
        }
      } catch (e) {
        Alert.alert('Помилка', 'Не вдалося завантажити зображення');
      }
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
      <KeyboardAvoidingView 
        style={{flex: 1}} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{flex: 1}}>
            <View style={[styles.header, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={{ color: colors.primary, fontSize: 16 }}>◀ Назад</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>{receiverName || 'Чат'}</Text>
              <View style={{width: 50}} />
            </View>

            {loading ? (
              <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                  <Text style={{color: colors.textSecondary}}>Завантаження повідомлень...</Text>
              </View>
            ) : (
              <>
                <ScrollView 
                  ref={scrollViewRef}
                  contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', padding: 15 }}
                  onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                  style={{ flex: 1 }}
                >
            {messages.map((msg, index) => {
              const isMyMsg = msg.senderId === currentUserId;
              return (
                <View key={msg.id || index} style={[styles.msgWrapper, isMyMsg ? styles.myMsgWrapper : styles.theirMsgWrapper]}>
                  <View style={[
                      styles.bubble, 
                      isMyMsg ? { backgroundColor: colors.primary, borderBottomRightRadius: 5 } 
                              : { backgroundColor: isDark ? '#333' : '#F0F0F0', borderBottomLeftRadius: 5 }
                  ]}>
                    {msg.imageUrl && (
                      <Image source={{ uri: msg.imageUrl }} style={styles.chatImage} />
                    )}
                {msg.text && (
                  <Text style={{ fontSize: 16, color: isMyMsg ? '#fff' : colors.text }}>
                    {msg.text}
                  </Text>
                )}
                <View style={styles.msgFooter}>
                  <Text style={{ fontSize: 10, color: isMyMsg ? 'rgba(255,255,255,0.8)' : colors.textSecondary, marginRight: 5 }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                  {isMyMsg && (
                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)' }}>{msg.isRead ? '✓✓' : '✓'}</Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
          <Text style={{ fontSize: 24, color: colors.primary }}>📷</Text>
        </TouchableOpacity>
        
        <TextInput 
          style={[styles.input, { backgroundColor: isDark ? '#222' : '#f0f0f0', color: colors.text }]}
          placeholder="Повідомлення..."
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />

        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={handleSend}>
          <Text style={{ fontSize: 18, color: '#fff' }}>⬆️</Text>
        </TouchableOpacity>
      </View>
          </>
        )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1 },
  backBtn: { padding: 5 },
  msgWrapper: { marginBottom: 15, flexDirection: 'row' },
  myMsgWrapper: { justifyContent: 'flex-end' },
  theirMsgWrapper: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '85%', padding: 12, borderRadius: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1 },
  chatImage: { width: 220, height: 220, borderRadius: 10, marginBottom: 5 },
  msgFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5, alignItems: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1 },
  attachBtn: { padding: 10 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 12, fontSize: 16, maxHeight: 100 },
  sendBtn: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});
