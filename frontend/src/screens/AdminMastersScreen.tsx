import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, Dimensions, TextInput } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import api from '../api/client';

const screenWidth = Dimensions.get('window').width;

export const AdminMastersScreen = () => {
    const [masters, setMasters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    
    // Analytics Modal State
    const [analyticsVisible, setAnalyticsVisible] = useState(false);
    const [selectedMaster, setSelectedMaster] = useState<any>(null);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    useEffect(() => {
        loadMasters();
    }, []);

    const filteredMasters = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return masters;
        return masters.filter(m => [
            m.name,
            m.salonName,
            m.phone,
            m.email,
            m.city,
            m.address,
            m.subscription?.plan,
            m.subscription?.status
        ].filter(Boolean).join(' ').toLowerCase().includes(q));
    }, [masters, query]);

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

    const resetPassword = async (masterId: string) => {
        Alert.alert('WARNING', 'Generate new temporary password for this node?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Execute', style: 'destructive', onPress: async () => {
                try {
                    const res = await api.put(`/api/admin/masters/${masterId}/reset-password`);
                    Alert.alert('SUCCESS', `New access key:\n\n${res.data.newPassword}\n\nTransmit to owner.`);
                } catch(e) {
                    Alert.alert('ERROR', 'Failed to generate key');
                }
            }}
        ]);
    };

    const updateSubscription = async (masterId: string, plan: 'PRO' | 'FREE') => {
        const isPro = plan === 'PRO';
        Alert.alert('Підтвердження', isPro ? 'Увімкнути PRO для майстра на 30 днів?' : 'Перевести майстра на FREE?', [
            { text: 'Скасувати', style: 'cancel' },
            { text: 'Так', onPress: async () => {
                try {
                    await api.put(`/api/admin/masters/${masterId}/subscription`, {
                        plan,
                        status: 'ACTIVE',
                        durationDays: isPro ? 30 : null
                    });
                    loadMasters();
                } catch(e) {
                    Alert.alert('ERROR', 'Failed to update PRO status');
                }
            }}
        ]);
    };

    const toggleBan = async (masterId: string, currentStatus: boolean) => {
        Alert.alert('CONFIRMATION', currentStatus ? 'Restore node access?' : 'Suspend node access?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Execute', onPress: async () => {
                try {
                    await api.put(`/api/admin/users/${masterId}/ban`, { isBanned: !currentStatus });
                    loadMasters();
                } catch(e) {
                    Alert.alert('ERROR', 'Failed to update status');
                }
            }}
        ]);
    };

    const deleteUser = async (userId: string, userName: string) => {
        Alert.alert('CRITICAL WARNING', `PERMANENTLY DELETE node ${userName}? All data will be purged!`, [
            { text: 'Abort', style: 'cancel' },
            { text: 'PURGE', style: 'destructive', onPress: async () => {
                try {
                    await api.delete(`/api/admin/users/${userId}`);
                    loadMasters();
                } catch(e) {
                    Alert.alert('ERROR', 'Failed to purge data');
                }
            }}
        ]);
    };

    const openAnalytics = async (master: any) => {
        setSelectedMaster(master);
        setAnalyticsVisible(true);
        setLoadingAnalytics(true);
        try {
            const res = await api.get(`/api/admin/masters/${master.id}/analytics`);
            setAnalyticsData(res.data);
        } catch(e) {
            Alert.alert('ERROR', 'Failed to fetch telemetry');
            setAnalyticsVisible(false);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const chartConfig = {
      backgroundColor: '#0B1021',
      backgroundGradientFrom: '#0B1021',
      backgroundGradientTo: '#111827',
      color: (opacity = 1) => `rgba(56, 189, 248, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
      barPercentage: 0.5,
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#00FFAA" /></View>;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.header}>ЦЕНТР КЕРУВАННЯ МАЙСТРАМИ</Text>
            <View style={styles.summaryRow}>
                <View style={styles.summaryCard}><Text style={styles.summaryVal}>{masters.length}</Text><Text style={styles.summaryLabel}>МАЙСТРІВ</Text></View>
                <View style={styles.summaryCard}><Text style={[styles.summaryVal, {color: '#00FFAA'}]}>{masters.filter(m => m.subscription?.plan === 'PRO').length}</Text><Text style={styles.summaryLabel}>PRO</Text></View>
                <View style={styles.summaryCard}><Text style={[styles.summaryVal, {color: '#F5A623'}]}>{masters.filter(m => m.referralEnabled === false).length}</Text><Text style={styles.summaryLabel}>БЕЗ РЕФ.</Text></View>
            </View>
            <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Пошук: ім'я, телефон, місто, PRO..."
                placeholderTextColor="#64748B"
            />
            <TouchableOpacity style={styles.refreshBtn} onPress={loadMasters}>
                <Text style={styles.refreshText}>ОНОВИТИ ДАНІ</Text>
            </TouchableOpacity>
            {filteredMasters.map(m => {
                const isPro = m.subscription?.plan === 'PRO' && ['ACTIVE', 'TRIAL'].includes(m.subscription?.status);
                return (
                    <View key={m.id} style={styles.card}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <View>
                                <Text style={styles.name}>{m.salonName || m.name}</Text>
                                <Text style={styles.subtext}>{m.phone || m.email}</Text>
                                <Text style={styles.subtext}>Власник: {m.name}</Text>
                                <Text style={styles.subtext}>Адреса: {[m.city, m.address].filter(Boolean).join(', ') || 'не вказано'}</Text>
                                <Text style={styles.subtext}>Клієнти: {m._count?.myClients || 0} • Записи: {m._count?.appointments || 0}</Text>
                                <Text style={styles.subtext}>Реєстрація: {new Date(m.createdAt).toLocaleDateString()}</Text>
                            </View>
                            <View style={{gap: 5, alignItems: 'flex-end'}}>
                                <View style={[styles.badge, { backgroundColor: isPro ? 'rgba(0, 255, 170, 0.2)' : 'rgba(148, 163, 184, 0.15)' }]}>
                                    <Text style={[styles.badgeText, {color: isPro ? '#00FFAA' : '#94A3B8'}]}>{isPro ? 'PRO' : 'FREE'}</Text>
                                </View>
                                <View style={[styles.badge, { backgroundColor: m.referralEnabled === false ? 'rgba(245, 166, 35, 0.15)' : 'rgba(56, 189, 248, 0.15)' }]}>
                                    <Text style={[styles.badgeText, {color: m.referralEnabled === false ? '#F5A623' : '#38BDF8'}]}>{m.referralEnabled === false ? 'REF OFF' : 'REF ON'}</Text>
                                </View>
                                {m.isBanned ? (
                                    <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                                        <Text style={[styles.badgeText, {color: '#EF4444'}]}>ЗАБЛОКОВАНО</Text>
                                    </View>
                                ) : (
                                    <View style={[styles.badge, { backgroundColor: 'rgba(0, 255, 170, 0.2)' }]}>
                                        <Text style={[styles.badgeText, {color: '#00FFAA'}]}>ОНЛАЙН</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        
                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.btn, {borderColor: isPro ? '#F5A623' : '#00FFAA'}]} onPress={() => updateSubscription(m.id, isPro ? 'FREE' : 'PRO')}>
                                <Text style={[styles.btnText, {color: isPro ? '#F5A623' : '#00FFAA'}]}>{isPro ? 'ЗНЯТИ PRO' : 'УВІМКНУТИ PRO'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, {borderColor: '#38BDF8'}]} onPress={() => openAnalytics(m)}>
                                <Text style={[styles.btnText, {color: '#38BDF8'}]}>ТЕЛЕМЕТРІЯ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, {borderColor: '#94A3B8', marginLeft: 10}]} onPress={() => resetPassword(m.id)}>
                                <Text style={[styles.btnText, {color: '#94A3B8'}]}>СКИДАННЯ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, {borderColor: m.isBanned ? '#00FFAA' : '#F5A623', marginLeft: 10}]} onPress={() => toggleBan(m.id, m.isBanned)}>
                                <Text style={[styles.btnText, {color: m.isBanned ? '#00FFAA' : '#F5A623'}]}>{m.isBanned ? 'РОЗБАН' : 'БАН'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, {borderColor: '#EF4444', marginLeft: 'auto'}]} onPress={() => deleteUser(m.id, m.name)}>
                                <Text style={[styles.btnText, {color: '#EF4444'}]}>ВИДАЛИТИ</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            })}
            {filteredMasters.length === 0 && <Text style={styles.emptyText}>Нічого не знайдено</Text>}
            <View style={{height: 50}} />

            {/* Analytics Modal */}
            <Modal visible={analyticsVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setAnalyticsVisible(false)}>
                            <Text style={styles.closeBtnTxt}>ЗАКРИТИ_</Text>
                        </TouchableOpacity>
                        
                        <Text style={styles.modalHeader}>ТЕЛЕМЕТРІЯ ВУЗЛА: {selectedMaster?.name}</Text>
                        
                        {loadingAnalytics ? (
                            <View style={{padding: 50}}><ActivityIndicator size="large" color="#00FFAA" /></View>
                        ) : analyticsData ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20}}>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statBoxVal}>{analyticsData.totalClients}</Text>
                                        <Text style={styles.statBoxLabel}>ВІДОМІ КЛІЄНТИ</Text>
                                    </View>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statBoxVal}>{analyticsData.totalAppointments}</Text>
                                        <Text style={styles.statBoxLabel}>ЗАПИСИ (TX)</Text>
                                    </View>
                                </View>

                                <Text style={styles.modalSubHeader}>АНАЛІЗ СТАТУСІВ TX</Text>
                                <BarChart
                                    data={{
                                        labels: analyticsData.chartData.map((d: any) => d.name),
                                        datasets: [{ data: analyticsData.chartData.some((d: any) => d.count > 0) ? analyticsData.chartData.map((d: any) => d.count) : [0,0,0,0] }]
                                    }}
                                    width={screenWidth - 80}
                                    height={220}
                                    yAxisLabel=""
                                    yAxisSuffix=""
                                    chartConfig={chartConfig}
                                    style={{borderRadius: 12, marginVertical: 8}}
                                />
                            </ScrollView>
                        ) : null}
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617', padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' },
    header: { fontSize: 20, fontWeight: '900', color: '#F8FAFC', marginBottom: 20, marginTop: 40, letterSpacing: 2 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryCard: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', borderWidth: 1, borderColor: '#1E293B', borderRadius: 12, padding: 12, marginHorizontal: 4, alignItems: 'center' },
    summaryVal: { color: '#38BDF8', fontSize: 24, fontWeight: '900' },
    summaryLabel: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
    searchInput: { backgroundColor: '#0B1021', color: '#F8FAFC', borderWidth: 1, borderColor: '#1E293B', borderRadius: 12, padding: 12, marginBottom: 10 },
    refreshBtn: { alignSelf: 'flex-end', borderWidth: 1, borderColor: '#38BDF8', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8, marginBottom: 14 },
    refreshText: { color: '#38BDF8', fontSize: 11, fontWeight: 'bold' },
    emptyText: { color: '#64748B', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
    
    card: { backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(51, 65, 85, 0.5)' },
    name: { fontSize: 16, fontWeight: 'bold', color: '#E2E8F0', letterSpacing: 1 },
    subtext: { color: '#64748B', fontSize: 11, marginTop: 4, fontFamily: 'Courier' },
    
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: 'transparent' },
    badgeText: { fontWeight: '900', fontSize: 10, letterSpacing: 1 },
    
    actions: { flexDirection: 'row', marginTop: 20, justifyContent: 'flex-start', flexWrap: 'wrap' },
    btn: { backgroundColor: 'transparent', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1 },
    btnText: { fontWeight: 'bold', fontSize: 10, letterSpacing: 1 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#0B1021', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%', borderWidth: 1, borderColor: '#1E293B' },
    closeBtn: { alignSelf: 'flex-end', padding: 10 },
    closeBtnTxt: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold', fontFamily: 'Courier' },
    modalHeader: { fontSize: 16, fontWeight: '900', color: '#00FFAA', marginBottom: 20, letterSpacing: 1 },
    modalSubHeader: { fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 10, letterSpacing: 1 },
    
    statBox: { flex: 1, backgroundColor: 'rgba(30, 41, 59, 0.5)', marginHorizontal: 5, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1E293B' },
    statBoxVal: { fontSize: 28, fontWeight: '900', color: '#38BDF8', textShadowColor: 'rgba(56, 189, 248, 0.3)', textShadowOffset: {width:0, height:0}, textShadowRadius: 10 },
    statBoxLabel: { fontSize: 10, color: '#94A3B8', marginTop: 5, fontWeight: 'bold', letterSpacing: 1 }
});
