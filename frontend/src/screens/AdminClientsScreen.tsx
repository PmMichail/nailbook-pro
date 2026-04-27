import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import api from '../api/client';

export const AdminClientsScreen = () => {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/admin/clients');
            setClients(res.data);
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleBan = async (clientId: string, currentStatus: boolean) => {
        Alert.alert('Підтвердження', currentStatus ? 'Розблокувати клієнта?' : 'Тимчасово заблокувати клієнта?', [
            { text: 'Скасувати', style: 'cancel' },
            { text: 'Так', onPress: async () => {
                try {
                    await api.put(`/api/admin/users/${clientId}/ban`, { isBanned: !currentStatus });
                    Alert.alert('Успіх', 'Статус оновлено');
                    loadClients();
                } catch(e) {
                    Alert.alert('Помилка', 'Не вдалося оновити статус');
                }
            }}
        ]);
    };

    const deleteUser = async (userId: string, userName: string) => {
        Alert.alert('УВАГА: НЕЗВОРОТНЯ ДІЯ', `Ви точно хочете повністю видалити акаунт ${userName}?`, [
            { text: 'Скасувати', style: 'cancel' },
            { text: 'ВИДАЛИТИ', style: 'destructive', onPress: async () => {
                try {
                    await api.delete(`/api/admin/users/${userId}`);
                    Alert.alert('Успіх', 'Акаунт видалено');
                    loadClients();
                } catch(e) {
                    Alert.alert('Помилка', 'Не вдалося видалити');
                }
            }}
        ]);
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF69B4" /></View>;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>База Клієнтів</Text>
            {clients.map(c => (
                <View key={c.id} style={styles.card}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                        <View>
                            <Text style={styles.name}>{c.name}</Text>
                            <Text style={styles.subtext}>{c.phone || c.email}</Text>
                            <Text style={styles.subtext}>Зареєстровано: {new Date(c.createdAt).toLocaleDateString()}</Text>
                            {c.masterId && <Text style={{color: '#FF69B4', fontSize: 12, marginTop: 5}}>Є майстер</Text>}
                        </View>
                        <View style={[styles.badge, { backgroundColor: c.isBanned ? '#ffcccc' : '#d4edda' }]}>
                            <Text style={[styles.badgeText, { color: c.isBanned ? '#cc0000' : '#155724' }]}>
                                {c.isBanned ? 'Заблоковано' : 'Активний'}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.actions}>
                        <TouchableOpacity style={[styles.banBtn, { backgroundColor: c.isBanned ? '#4CAF50' : '#8b0000' }]} onPress={() => toggleBan(c.id, c.isBanned)}>
                            <Text style={styles.btnText}>{c.isBanned ? 'Розблокувати' : 'Заблокувати'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.banBtn, {backgroundColor: 'transparent', marginLeft: 'auto', borderWidth: 1, borderColor: '#ff0000'}]} onPress={() => deleteUser(c.id, c.name)}>
                            <Text style={[styles.btnText, {color: '#ff0000'}]}>Видалити</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
            <View style={{height: 50}} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8', padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20, marginTop: 10 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    subtext: { color: '#666', fontSize: 13, marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    badgeText: { fontWeight: 'bold', fontSize: 12 },
    actions: { flexDirection: 'row', marginTop: 15, justifyContent: 'flex-start' },
    banBtn: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 }
});
