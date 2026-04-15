import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import api from '../api/client';

export const AdminMastersScreen = () => {
    const [masters, setMasters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMasters();
    }, []);

    const loadMasters = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/admin/masters');
            setMasters(res.data);
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const grantProStatus = async (masterId: string) => {
        Alert.alert('Підтвердження', 'Встановити PRO статус для цього майстра на 30 днів?', [
            { text: 'Ні', style: 'cancel' },
            { text: 'Так', onPress: async () => {
                try {
                    await api.put(`/api/admin/masters/${masterId}/subscription`, {
                        plan: 'PRO', status: 'ACTIVE', durationDays: 30
                    });
                    Alert.alert('Успіх', 'Статус оновлено');
                    loadMasters();
                } catch(e) {
                    Alert.alert('Помилка', 'Не вдалося оновити статус');
                }
            }}
        ]);
    };

    const grantFreeStatus = async (masterId: string) => {
        Alert.alert('Підтвердження', 'Перевести майстра на тариф FREE безлімітно?', [
            { text: 'Ні', style: 'cancel' },
            { text: 'Так', onPress: async () => {
                try {
                    // Nulling durationDays effectively removes expiration
                    await api.put(`/api/admin/masters/${masterId}/subscription`, {
                        plan: 'FREE', status: 'ACTIVE', durationDays: null
                    });
                    Alert.alert('Успіх', 'Статус оновлено на FREE');
                    loadMasters();
                } catch(e) {
                    Alert.alert('Помилка', 'Не вдалося оновити статус');
                }
            }}
        ]);
    };

    const resetPassword = async (masterId: string) => {
        Alert.alert('Обережно', 'Згенерувати новий тимчасовий пароль для цього майстра?', [
            { text: 'Скасувати', style: 'cancel' },
            { text: 'Так', style: 'destructive', onPress: async () => {
                try {
                    const res = await api.put(`/api/admin/masters/${masterId}/reset-password`);
                    Alert.alert('Успіх', `Новий пароль для майстра:\n\n${res.data.newPassword}\n\nОбов'язково передайте його власнику.`);
                } catch(e) {
                    Alert.alert('Помилка', 'Не вдалося скинути пароль');
                }
            }}
        ]);
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF69B4" /></View>;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>База Майстрів</Text>
            {masters.map(m => {
                const sub = m.subscription || { plan: 'FREE', status: 'ACTIVE' };
                const isPro = sub.plan === 'PRO' && (sub.status === 'ACTIVE' || sub.status === 'TRIAL');

                return (
                    <View key={m.id} style={styles.card}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <View>
                                <Text style={styles.name}>{m.name}</Text>
                                <Text style={styles.subtext}>{m.phone || m.email}</Text>
                                <Text style={styles.subtext}>Зареєстровано: {new Date(m.createdAt).toLocaleDateString()}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: isPro ? '#FFD700' : '#ddd' }]}>
                                <Text style={styles.badgeText}>{isPro ? 'PRO' : 'FREE'}</Text>
                            </View>
                        </View>
                        
                        {isPro && sub.currentPeriodEnd && (
                            <Text style={styles.expText}>PRO діє до: {new Date(sub.currentPeriodEnd).toLocaleDateString()}</Text>
                        )}

                        <View style={styles.actions}>
                            {!isPro ? (
                                <TouchableOpacity style={styles.upgradeBtn} onPress={() => grantProStatus(m.id)}>
                                    <Text style={styles.btnText}>+ PRO на 30 днів</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={styles.downgradeBtn} onPress={() => grantFreeStatus(m.id)}>
                                    <Text style={styles.btnTextDowngrade}>Скинути на FREE</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={[styles.downgradeBtn, {backgroundColor: '#eee', marginLeft: 10}]} onPress={() => resetPassword(m.id)}>
                                <Text style={[styles.btnTextDowngrade, {color: '#555'}]}>Скинути пароль</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            })}
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
    badgeText: { fontWeight: 'bold', color: '#333', fontSize: 12 },
    expText: { color: '#ff8c00', marginTop: 10, fontWeight: 'bold' },
    actions: { flexDirection: 'row', marginTop: 15, justifyContent: 'flex-start' },
    upgradeBtn: { backgroundColor: '#FF69B4', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
    downgradeBtn: { backgroundColor: '#ffebe6', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    btnTextDowngrade: { color: 'red', fontWeight: 'bold', fontSize: 13 }
});
