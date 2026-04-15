import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Share, TextInput, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../api/client';
import Checkbox from 'expo-checkbox';

export const ClientsListScreen = () => {
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
      <TouchableOpacity style={styles.clientCard} onPress={() => openClientDetails(item)}>
        <Checkbox 
           value={selectedIds.has(item.id)} 
           onValueChange={() => toggleSelect(item.id)} 
           color={selectedIds.has(item.id) ? '#FF69B4' : undefined}
           style={{marginRight: 10}}
        />
        <View style={styles.clientInfo}>
           <Text style={styles.clientName}>{item.name}</Text>
           <Text style={styles.clientPhone}>{item.phone}</Text>
        </View>
        <Text style={styles.lastVisit}>{formattedDate}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={[styles.container, {justifyContent:'center'}]}><ActivityIndicator size="large" color="#FF69B4" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Мої клієнти {clients.length > 0 && `(${clients.length})`}</Text>
      
      <View style={styles.inviteContainer}>
         <TouchableOpacity style={styles.shareBtn} onPress={handleShareLink}>
           <Text style={styles.shareBtnText}>Запросити ще 🔗</Text>
         </TouchableOpacity>
      </View>

      <TextInput 
        style={styles.searchInput}
        placeholder="Пошук клієнтів..."
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.actionsRow}>
         <TouchableOpacity onPress={toggleSelectAll} style={{flexDirection: 'row', alignItems: 'center'}}>
           <Checkbox 
             value={selectedIds.size === filteredClients.length && filteredClients.length > 0} 
             onValueChange={toggleSelectAll} 
             color="#FF69B4" 
           />
           <Text style={{marginLeft: 8, color: '#333'}}>Вибрати всіх</Text>
         </TouchableOpacity>
         
         <TouchableOpacity 
            style={[styles.bulkBtn, selectedIds.size === 0 && {opacity: 0.5}]} 
            disabled={selectedIds.size === 0}
            onPress={() => setShowBulkModal(true)}
         >
           <Text style={styles.bulkBtnText}>Розсилка ({selectedIds.size})</Text>
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
            <View style={styles.modalCard}>
               <Text style={styles.modalTitle}>Нове повідомлення</Text>
               <Text>Буде надіслано: {selectedIds.size} клієнтам</Text>
               <TextInput 
                  style={styles.modalInput}
                  multiline
                  numberOfLines={4}
                  placeholder="Введіть текст розсилки..."
                  value={bulkMsg}
                  onChangeText={setBulkMsg}
               />
               <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBulkModal(false)}>
                     <Text style={{color: '#888'}}>Скасувати</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSendBulk}>
                     <Text style={{color: '#fff', fontWeight: 'bold'}}>Відправити</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </KeyboardAvoidingView>
      </Modal>

      {/* Client Detail / Edit Modal */}
      <Modal visible={!!selectedClient} transparent={true} animationType="fade">
         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
            <View style={[styles.modalCard, {width: '90%'}]}>
               <Text style={styles.modalTitle}>Дані клієнта</Text>
               <TextInput style={styles.modalInputSingle} placeholder="Ім'я" value={editName} onChangeText={setEditName} />
               <TextInput style={styles.modalInputSingle} placeholder="Телефон" value={editPhone} onChangeText={setEditPhone} />
               <TextInput style={styles.modalInput} multiline numberOfLines={3} placeholder="Нотатки (лише для вас)" value={editNotes} onChangeText={setEditNotes} />
               
               <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedClient(null)}>
                     <Text style={{color: '#888'}}>Закрити</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveBtn, {backgroundColor: '#FF3B30', marginRight: 10}]} onPress={handleDeleteClient}>
                     <Text style={{color: '#fff', fontWeight: 'bold'}}>Видалити</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveClient}>
                     <Text style={{color: '#fff', fontWeight: 'bold'}}>Зберегти</Text>
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
  header: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 40 },
  inviteContainer: { marginBottom: 15 },
  shareBtn: { backgroundColor: '#FF69B4', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  shareBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  searchInput: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  bulkBtn: { backgroundColor: '#FF69B4', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  bulkBtnText: { color: '#fff', fontWeight: '600' },
  clientCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  clientPhone: { fontSize: 14, color: '#FF69B4' },
  lastVisit: { fontSize: 12, color: '#999' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '80%', backgroundColor: '#fff', padding: 20, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 10, height: 100, textAlignVertical: 'top', marginTop: 10, marginBottom: 10 },
  modalInputSingle: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, marginBottom: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelBtn: { padding: 10, marginRight: 10 },
  saveBtn: { backgroundColor: '#FF69B4', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }
});
