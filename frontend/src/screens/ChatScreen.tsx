import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, SafeAreaView, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const CURRENT_USER_ID = '123'; // Має братись з Auth Context

export const ChatScreen = ({ route }: any) => {
  const navigation = useNavigation();
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
    <SafeAreaView style={{flex: 1, backgroundColor: '#1E1E1E'}}>
      <KeyboardAvoidingView 
        style={{flex: 1}} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{flex: 1}}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backText}>◀ Назад</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{receiverName || 'Чат'}</Text>
              <View style={{width: 50}} />
            </View>

            {loading ? (
              <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                  <Text style={{color:'#fff'}}>Завантаження повідомлень...</Text>
              </View>
            ) : (
              <>
                <ScrollView 
                  ref={scrollViewRef}
                  contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', padding: 15 }}
                  onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                  style={styles.messagesContainer}
                >
            {messages.map((msg, index) => {
              const isMyMsg = msg.senderId === currentUserId;
              return (
                <View key={msg.id || index} style={[styles.msgWrapper, isMyMsg ? styles.myMsgWrapper : styles.theirMsgWrapper]}>
                  <View style={[styles.bubble, isMyMsg ? styles.myBubble : styles.theirBubble]}>
                    {msg.imageUrl && (
                      <Image source={{ uri: msg.imageUrl }} style={styles.chatImage} />
                    )}
                {msg.text && (
                  <Text style={[styles.msgText, isMyMsg ? styles.myMsgText : styles.theirMsgText]}>
                    {msg.text}
                  </Text>
                )}
                <View style={styles.msgFooter}>
                  <Text style={styles.msgTime}>
                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                  {isMyMsg && (
                    <Text style={styles.readStatus}>{msg.isRead ? '✓✓' : '✓'}</Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
          <Text style={styles.attachIcon}>📷</Text>
        </TouchableOpacity>
        
        <TextInput 
          style={styles.input}
          placeholder="Повідомлення..."
          value={inputText}
          onChangeText={setInputText}
          multiline
        />

        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Text style={styles.sendIcon}>⬆️</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: '#333' },
  backBtn: { padding: 5 },
  backText: { color: '#FF69B4', fontSize: 16 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  container: { flex: 1, backgroundColor: '#1E1E1E' }, 
  messagesContainer: { flex: 1, padding: 15 },
  msgWrapper: { marginBottom: 15, flexDirection: 'row' },
  myMsgWrapper: { justifyContent: 'flex-end' },
  theirMsgWrapper: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1 },
  myBubble: { backgroundColor: '#FF69B4', borderBottomRightRadius: 5 }, // Рожевий
  theirBubble: { backgroundColor: '#F0F0F0', borderBottomLeftRadius: 5 }, // Світло-сірий
  chatImage: { width: 200, height: 200, borderRadius: 10, marginBottom: 5 },
  msgText: { fontSize: 16 },
  myMsgText: { color: '#fff' },
  theirMsgText: { color: '#333' },
  msgFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5, alignItems: 'center' },
  msgTime: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginRight: 5 },
  readStatus: { fontSize: 10, color: 'rgba(255,255,255,0.9)' },
  
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  attachBtn: { padding: 10 },
  attachIcon: { fontSize: 24 },
  input: { flex: 1, backgroundColor: '#f9f9f9', borderRadius: 20, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 12, fontSize: 16, maxHeight: 100 },
  sendBtn: { backgroundColor: '#98FB98', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  sendIcon: { fontSize: 18 }
});
