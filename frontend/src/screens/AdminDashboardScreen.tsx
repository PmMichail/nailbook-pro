import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, FlatList } from 'react-native';
import api from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AdminDashboardScreen = ({ navigation }: any) => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW'|'MONITOR'|'SETTINGS'>('OVERVIEW');
    
    // Overview Data
    const [stats, setStats] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    
    // Monitor Data
    const [events, setEvents] = useState<any[]>([]);
    
    // Settings Data
    const [proPrice, setProPrice] = useState('299');
    const [loadingSettings, setLoadingSettings] = useState(false);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [resStats, resPay, resEvents, resConfig] = await Promise.all([
                api.get('/api/admin/statistics'),
                api.get('/api/admin/payments'),
                api.get('/api/admin/activity'),
                api.get('/api/admin/config')
            ]);
            
            setStats(resStats.data);
            setPayments(resPay.data);
            setEvents(resEvents.data);
            if (resConfig.data.PRO_PRICE) {
                setProPrice(resConfig.data.PRO_PRICE);
            }
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!proPrice) return Alert.alert('Помилка', 'Введіть ціну');
        try {
            setLoadingSettings(true);
            await api.post('/api/admin/config', { key: 'PRO_PRICE', value: proPrice });
            Alert.alert('Успіх', 'Ціну підписки оновлено!');
        } catch(e) {
            Alert.alert('Помилка', 'Не вдалося зберегти налаштування');
        } finally {
            setLoadingSettings(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF69B4" /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.header}>Дослідник Системи</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}><Text style={styles.logoutTxt}>Вийти</Text></TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tab, activeTab === 'OVERVIEW' && styles.activeTab]} onPress={() => setActiveTab('OVERVIEW')}>
                    <Text style={[styles.tabText, activeTab === 'OVERVIEW' && styles.activeTabText]}>📊 Огляд</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'MONITOR' && styles.activeTab]} onPress={() => setActiveTab('MONITOR')}>
                    <Text style={[styles.tabText, activeTab === 'MONITOR' && styles.activeTabText]}>📡 Монітор</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'SETTINGS' && styles.activeTab]} onPress={() => setActiveTab('SETTINGS')}>
                    <Text style={[styles.tabText, activeTab === 'SETTINGS' && styles.activeTabText]}>⚙️ Налаштування</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'OVERVIEW' && (
                <ScrollView>
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={styles.statVal}>{stats?.totalMasters}</Text>
                            <Text style={styles.statL}>Майстрів</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statVal}>{stats?.totalClients}</Text>
                            <Text style={styles.statL}>Клієнтів</Text>
                        </View>
                    </View>
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={styles.statVal}>{stats?.activePro}</Text>
                            <Text style={styles.statL}>PRO Підписки</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statVal}>{stats?.revenue} ₴</Text>
                            <Text style={styles.statL}>Дохід (успішний)</Text>
                        </View>
                    </View>

                    <Text style={styles.subHeader}>Останні Транзакції</Text>
                    {payments.map(p => (
                        <View key={p.id} style={styles.payCard}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <Text style={{fontWeight: 'bold'}}>{p.master?.name || 'Unknown'} <Text style={{fontWeight: 'normal', color: '#666', fontSize: 12}}>({p.master?.phone || ''})</Text></Text>
                                <Text style={{color: p.status === 'success' ? 'green' : 'red', fontWeight: 'bold'}}>{p.amount} {p.currency}</Text>
                            </View>
                            <Text style={{color: '#999', fontSize: 12, marginTop: 5}}>{new Date(p.createdAt).toLocaleString()} | ID: {p.liqpayOrderId}</Text>
                        </View>
                    ))}
                    <View style={{height: 50}} />
                </ScrollView>
            )}

            {activeTab === 'MONITOR' && (
                <FlatList
                    data={events}
                    keyExtractor={item => item.id}
                    renderItem={({item}) => {
                        let colorBorder = '#ddd';
                        if (item.type === 'USER_REG') colorBorder = '#4A90E2';
                        if (item.type === 'NEW_APPT') colorBorder = '#50E3C2';
                        if (item.type === 'PAYMENT') colorBorder = '#F5A623';

                        return (
                            <View style={[styles.eventCard, { borderLeftColor: colorBorder }]}>
                                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5}}>
                                    <Text style={{fontWeight: 'bold', fontSize: 15, color: '#333'}}>{item.title}</Text>
                                    <Text style={{fontSize: 12, color: '#999'}}>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                                </View>
                                <Text style={{color: '#666', fontSize: 14}}>{item.details}</Text>
                            </View>
                        );
                    }}
                    contentContainerStyle={{paddingBottom: 50}}
                />
            )}

            {activeTab === 'SETTINGS' && (
                <ScrollView>
                    <View style={styles.settingsCard}>
                        <Text style={styles.settingsTitle}>Місячна Підписка PRO (UAH)</Text>
                        <Text style={styles.settingsDesc}>Ця сума буде використовуватися для нових оплат через LiqPay.</Text>
                        <TextInput
                            style={styles.input}
                            value={String(proPrice)}
                            onChangeText={setProPrice}
                            keyboardType="numeric"
                        />
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveConfig} disabled={loadingSettings}>
                            {loadingSettings ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Зберегти Налаштування</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8', paddingHorizontal: 15, paddingTop: 10 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15, marginTop: 40 },
    header: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    logoutBtn: { backgroundColor: '#ffebe6', padding: 10, borderRadius: 10 },
    logoutTxt: { color: 'red', fontWeight: 'bold' },
    
    tabContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', pading: 5, borderRadius: 10, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    tabText: { color: '#64748b', fontWeight: '600' },
    activeTabText: { color: '#FF69B4', fontWeight: 'bold' },

    statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    statCard: { backgroundColor: '#fff', flex: 1, marginHorizontal: 5, padding: 15, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    statVal: { fontSize: 22, fontWeight: 'bold', color: '#FF69B4' },
    statL: { fontSize: 12, color: '#666', marginTop: 5 },
    subHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333', marginLeft: 5 },
    payCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },

    eventCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, borderLeftWidth: 5, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },

    settingsCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    settingsTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    settingsDesc: { fontSize: 13, color: '#666', marginBottom: 20 },
    input: { backgroundColor: '#F0F4F8', padding: 15, borderRadius: 10, fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    saveBtn: { backgroundColor: '#FF69B4', padding: 15, borderRadius: 10, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
