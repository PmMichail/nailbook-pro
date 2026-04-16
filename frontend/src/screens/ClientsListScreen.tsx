import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Share, TextInput, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../api/client';
import Checkbox from 'expo-checkbox';
import { useTheme } from '../context/ThemeContext';

export const ClientsListScreen = () => {
  const { colors, isDark } = useTheme();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Bulk messaging
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMsg, setBulkMsg] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Edit / Delete Modal
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/master/clients');
      setClients(res.data || []);
    } catch (e) {
      console.log('Error loading clients', e);
    } finally {
      setLoading(false);
    }
  };

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: 'Привіт! Записуйся до мене на манікюр через NailsBook Pro!',
      });
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося поділитися посиланням');
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredClients.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredClients.map(c => c.id)));
  };

  const handleSendBulk = async () => {
    if (!bulkMsg.trim() || selectedIds.size === 0) return;
    try {
      const res = await api.post('/api/master/send-bulk-notification', {
        clientIds: Array.from(selectedIds),
        message: bulkMsg
      });
      Alert.alert('Успіх', `Повідомлення надіслано ${res.data.sentCount} клієнтам!`);
      setShowBulkModal(false);
      setBulkMsg('');
      setSelectedIds(new Set());
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося відправити розсилку.');
    }
  };

  const openClientDetails = (client: any) => {
    setSelectedClient(client);
    setEditName(client.name);
    setEditPhone(client.phone);
    setEditNotes(client.notes || '');
  };

  const handleSaveClient = async () => {
    try {
      await api.put(`/api/master/clients/${selectedClient.id}`, {
        name: editName,
        phone: editPhone,
        notes: editNotes
      });
      Alert.alert('Збережено', 'Дані клієнта успішно оновлено');
      setSelectedClient(null);
      loadClients();
    } catch (e) {
      Alert.alert('Помилка', 'Не вдалося оновити клієнта');
    }
  };

  const handleDeleteClient = () => {
    Alert.alert('Видлення', 'Ви впевнені, що хочете видалити цього клієнта з вашої бази?', [
      { text: 'Скасувати', style: 'cancel' },
      { text: 'Видалити', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/api/master/clients/${selectedClient.id}`);
            setSelectedClient(null);
            loadClients();
          } catch(e) {
            Alert.alert('Помилка', 'Не вдалося видалити клієнта');
          }
      }}
    ]);
  };

  const filteredClients = clients.filter(c => 
     c.name.toLowerCase().includes(search.toLowerCase()) || 
     c.phone.includes(search)
  );

  const renderItem = ({ item }: any) => {
    const formattedDate = item.myAppointments && item.myAppointments.length > 0 
      ? new Date(item.myAppointments[0].date).toLocaleDateString() 
      : 'Немає візитів';

    return (
      <TouchableOpacity style={[styles.clientCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => openClientDetails(item)}>
        <Checkbox 
           value={selectedIds.has(item.id)} 
           onValueChange={() => toggleSelect(item.id)} 
           color={selectedIds.has(item.id) ? colors.primary : undefined}
           style={{marginRight: 10}}
        />
        <View style={styles.clientInfo}>
           <Text style={[styles.clientName, { color: colors.text }]}>{item.name}</Text>
           <Text style={[styles.clientPhone, { color: colors.primary }]}>{item.phone}</Text>
        </View>
        <Text style={[styles.lastVisit, { color: colors.textSecondary }]}>{formattedDate}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={[styles.container, {justifyContent:'center', backgroundColor: colors.background}]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Мої клієнти {clients.length > 0 && `(${clients.length})`}</Text>
      
      <View style={styles.inviteContainer}>
         <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.primary }]} onPress={handleShareLink}>
           <Text style={[styles.shareBtnText, { color: isDark ? '#000' : '#fff' }]}>Запросити ще 🔗</Text>
         </TouchableOpacity>
      </View>

      <TextInput 
        style={[styles.searchInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        placeholder="Пошук клієнтів..."
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.actionsRow}>
         <TouchableOpacity onPress={toggleSelectAll} style={{flexDirection: 'row', alignItems: 'center'}}>
           <Checkbox 
             value={selectedIds.size === filteredClients.length && filteredClients.length > 0} 
             onValueChange={toggleSelectAll} 
             color={colors.primary} 
           />
           <Text style={{marginLeft: 8, color: colors.textSecondary}}>Вибрати всіх</Text>
         </TouchableOpacity>
         
         <TouchableOpacity 
            style={[styles.bulkBtn, { backgroundColor: colors.primary }, selectedIds.size === 0 && {opacity: 0.5}]} 
            disabled={selectedIds.size === 0}
            onPress={() => setShowBulkModal(true)}
         >
           <Text style={[styles.bulkBtnText, { color: isDark ? '#000' : '#fff' }]}>Розсилка ({selectedIds.size})</Text>
         </TouchableOpacity>
      </View>

      <FlatList
        data={filteredClients}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Bulk Message Modal */}
      <Modal visible={showBulkModal} transparent={true} animationType="slide">
         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
               <Text style={[styles.modalTitle, { color: colors.text }]}>Нове повідомлення</Text>
               <Text style={{color: colors.textSecondary}}>Буде надіслано: {selectedIds.size} клієнтам</Text>
               <TextInput 
                  style={[styles.modalInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  multiline
                  numberOfLines={4}
                  placeholder="Введіть текст розсилки..."
                  placeholderTextColor={colors.textSecondary}
                  value={bulkMsg}
                  onChangeText={setBulkMsg}
               />
               <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBulkModal(false)}>
                     <Text style={{color: colors.textSecondary}}>Скасувати</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSendBulk}>
                     <Text style={{color: isDark ? '#000' : '#fff', fontWeight: 'bold'}}>Відправити</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </KeyboardAvoidingView>
      </Modal>

      {/* Client Detail / Edit Modal */}
      <Modal visible={!!selectedClient} transparent={true} animationType="fade">
         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
            <View style={[styles.modalCard, { width: '90%', backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
               <Text style={[styles.modalTitle, { color: colors.text }]}>Дані клієнта</Text>
               <TextInput style={[styles.modalInputSingle, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]} placeholder="Ім'я" placeholderTextColor={colors.textSecondary} value={editName} onChangeText={setEditName} />
               <TextInput style={[styles.modalInputSingle, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]} placeholder="Телефон" placeholderTextColor={colors.textSecondary} value={editPhone} onChangeText={setEditPhone} />
               <TextInput style={[styles.modalInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]} multiline numberOfLines={3} placeholder="Нотатки (лише для вас)" placeholderTextColor={colors.textSecondary} value={editNotes} onChangeText={setEditNotes} />
               
               <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedClient(null)}>
                     <Text style={{color: colors.textSecondary}}>Закрити</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveBtn, {backgroundColor: '#FF3B30', marginRight: 10}]} onPress={handleDeleteClient}>
                     <Text style={{color: '#fff', fontWeight: 'bold'}}>Видалити</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveClient}>
                     <Text style={{color: isDark ? '#000' : '#fff', fontWeight: 'bold'}}>Зберегти</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1,  padding: 15 },
  header: { fontSize: 24, fontFamily: 'serif', fontStyle: 'italic', marginBottom: 10, marginTop: 40 },
  inviteContainer: { marginBottom: 15 },
  shareBtn: { paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  shareBtnText: { fontSize: 16, fontWeight: 'bold' },
  searchInput: { padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  bulkBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  bulkBtnText: { fontWeight: '600' },
  clientCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, borderWidth: 1 },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 18, fontFamily: 'serif', fontWeight: 'bold', marginBottom: 5 },
  clientPhone: { fontSize: 14 },
  lastVisit: { fontSize: 12 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', padding: 20, borderRadius: 16 },
  modalTitle: { fontSize: 20, fontFamily: 'serif', fontStyle: 'italic', fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderRadius: 10, padding: 12, height: 100, textAlignVertical: 'top', marginTop: 10, marginBottom: 10 },
  modalInputSingle: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelBtn: { padding: 10, marginRight: 10 },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }
});
