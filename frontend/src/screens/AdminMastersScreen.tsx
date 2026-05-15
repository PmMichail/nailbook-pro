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
        Alert.alert('Скидання пароля', 'Створити новий тимчасовий пароль для майстра?', [
            { text: 'Скасувати', style: 'cancel' },
            { text: 'Створити', style: 'destructive', onPress: async () => {
                try {
                    const res = await api.put(`/api/admin/masters/${masterId}/reset-password`);
                    Alert.alert('Готово', `Новий тимчасовий пароль:\n\n${res.data.newPassword}\n\nПередайте його власнику акаунта.`);
                } catch(e) {
                    Alert.alert('Помилка', 'Не вдалося створити пароль');
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
                    Alert.alert('Помилка', 'Не вдалося оновити PRO статус');
                }
            }}
        ]);
    };

    const toggleBan = async (masterId: string, currentStatus: boolean) => {
        Alert.alert('Підтвердження', currentStatus ? 'Відновити доступ майстру?' : 'Заблокувати доступ майстру?', [
            { text: 'Скасувати', style: 'cancel' },
            { text: 'Так', onPress: async () => {
                try {
                    await api.put(`/api/admin/users/${masterId}/ban`, { isBanned: !currentStatus });
                    loadMasters();
                } catch(e) {
                    Alert.alert('Помилка', 'Не вдалося оновити статус');
                }
            }}
        ]);
    };

    const deleteUser = async (userId: string, userName: string) => {
        Alert.alert('Видалення акаунта', `Назавжди видалити майстра ${userName}? Усі дані буде втрачено.`, [
            { text: 'Скасувати', style: 'cancel' },
            { text: 'Видалити', style: 'destructive', onPress: async () => {
                try {
                    await api.delete(`/api/admin/users/${userId}`);
                    loadMasters();
                } catch(e) {
                    Alert.alert('Помилка', 'Не вдалося видалити акаунт');
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
            Alert.alert('Помилка', 'Не вдалося завантажити аналітику');
            setAnalyticsVisible(false);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const chartConfig = {
      backgroundColor: '#FFF8F5',
      backgroundGradientFrom: '#FFF8F5',
      backgroundGradientTo: '#F9E8E1',
      color: (opacity = 1) => `rgba(184, 116, 96, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(116, 100, 94, ${opacity})`,
      barPercentage: 0.5,
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#C88D7A" /></View>;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.kicker}>MASTERS CRM</Text>
            <Text style={styles.header}>Майстри та салони</Text>
            <View style={styles.summaryRow}>
                <View style={styles.summaryCard}><Text style={styles.summaryVal}>{masters.length}</Text><Text style={styles.summaryLabel}>Усього</Text></View>
                <View style={styles.summaryCard}><Text style={styles.summaryVal}>{masters.filter(m => m.subscription?.plan === 'PRO').length}</Text><Text style={styles.summaryLabel}>PRO</Text></View>
                <View style={styles.summaryCard}><Text style={styles.summaryVal}>{masters.filter(m => m.referralEnabled === false).length}</Text><Text style={styles.summaryLabel}>Без реф.</Text></View>
            </View>
            <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Пошук: ім'я, телефон, місто, адреса, PRO..."
                placeholderTextColor="#9B8580"
            />
            <TouchableOpacity style={styles.refreshBtn} onPress={loadMasters}>
                <Text style={styles.refreshText}>Оновити дані</Text>
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
                                <View style={[styles.badge, { backgroundColor: isPro ? '#F7E9E3' : '#F5EFEA' }]}>
                                    <Text style={[styles.badgeText, {color: isPro ? '#7A3E2F' : '#74645E'}]}>{isPro ? 'PRO' : 'FREE'}</Text>
                                </View>
                                <View style={[styles.badge, { backgroundColor: m.referralEnabled === false ? '#FFF3D8' : '#EFF7EA' }]}>
                                    <Text style={[styles.badgeText, {color: m.referralEnabled === false ? '#9A6A00' : '#5C8A48'}]}>{m.referralEnabled === false ? 'Реф. вимк.' : 'Реф. увімк.'}</Text>
                                </View>
                                {m.isBanned ? (
                                    <View style={[styles.badge, { backgroundColor: '#FFE8E2' }]}>
                                        <Text style={[styles.badgeText, {color: '#B75B4B'}]}>Заблоковано</Text>
                                    </View>
                                ) : (
                                    <View style={[styles.badge, { backgroundColor: '#EFF7EA' }]}>
                                        <Text style={[styles.badgeText, {color: '#7FB069'}]}>Активний</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        
                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.btn, {borderColor: isPro ? '#B75B4B' : '#C88D7A'}]} onPress={() => updateSubscription(m.id, isPro ? 'FREE' : 'PRO')}>
                                <Text style={[styles.btnText, {color: isPro ? '#B75B4B' : '#7A3E2F'}]}>{isPro ? 'Зняти PRO' : 'Увімкнути PRO'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, {borderColor: '#C88D7A'}]} onPress={() => openAnalytics(m)}>
                                <Text style={[styles.btnText, {color: '#7A3E2F'}]}>Аналітика</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, {borderColor: '#E7DAD4', marginLeft: 10}]} onPress={() => resetPassword(m.id)}>
                                <Text style={[styles.btnText, {color: '#74645E'}]}>Пароль</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, {borderColor: m.isBanned ? '#7FB069' : '#B75B4B', marginLeft: 10}]} onPress={() => toggleBan(m.id, m.isBanned)}>
                                <Text style={[styles.btnText, {color: m.isBanned ? '#7FB069' : '#B75B4B'}]}>{m.isBanned ? 'Розблокувати' : 'Блокувати'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, {borderColor: '#B75B4B', marginLeft: 'auto'}]} onPress={() => deleteUser(m.id, m.name)}>
                                <Text style={[styles.btnText, {color: '#B75B4B'}]}>Видалити</Text>
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
                            <Text style={styles.closeBtnTxt}>Закрити</Text>
                        </TouchableOpacity>
                        
                        <Text style={styles.modalHeader}>Аналітика майстра: {selectedMaster?.name}</Text>
                        
                        {loadingAnalytics ? (
                            <View style={{padding: 50}}><ActivityIndicator size="large" color="#C88D7A" /></View>
                        ) : analyticsData ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20}}>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statBoxVal}>{analyticsData.totalClients}</Text>
                                        <Text style={styles.statBoxLabel}>Клієнти</Text>
                                    </View>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statBoxVal}>{analyticsData.totalAppointments}</Text>
                                        <Text style={styles.statBoxLabel}>Записи</Text>
                                    </View>
                                </View>

                                <Text style={styles.modalSubHeader}>Статуси записів</Text>
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
    container: { flex: 1, backgroundColor: '#FFF9F6', padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9F6' },
    kicker: { color: '#C88D7A', fontSize: 12, fontWeight: '900', letterSpacing: 2.2, marginTop: 40, marginBottom: 6 },
    header: { fontSize: 30, fontWeight: '900', color: '#2A1D19', marginBottom: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryCard: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7DAD4', borderRadius: 22, padding: 14, marginHorizontal: 4, alignItems: 'center', shadowColor: '#C88D7A', shadowOffset: {width:0,height:8}, shadowOpacity: 0.08, shadowRadius: 16, elevation: 3 },
    summaryVal: { color: '#B87460', fontSize: 26, fontWeight: '900' },
    summaryLabel: { color: '#74645E', fontSize: 11, fontWeight: '800', marginTop: 4 },
    searchInput: { backgroundColor: '#FFFFFF', color: '#2A1D19', borderWidth: 1, borderColor: '#E7DAD4', borderRadius: 18, padding: 14, marginBottom: 10 },
    refreshBtn: { alignSelf: 'flex-end', borderWidth: 1, borderColor: '#C88D7A', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, marginBottom: 14, backgroundColor: '#FFF1EC' },
    refreshText: { color: '#7A3E2F', fontSize: 12, fontWeight: '900' },
    emptyText: { color: '#74645E', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
    
    card: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 26, marginBottom: 15, borderWidth: 1, borderColor: '#E7DAD4', shadowColor: '#C88D7A', shadowOffset: {width:0,height:10}, shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
    name: { fontSize: 18, fontWeight: '900', color: '#2A1D19' },
    subtext: { color: '#74645E', fontSize: 12, marginTop: 4 },
    
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: 'transparent' },
    badgeText: { fontWeight: '900', fontSize: 10 },
    
    actions: { flexDirection: 'row', marginTop: 20, justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8 },
    btn: { backgroundColor: '#FFF8F5', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, marginBottom: 8 },
    btnText: { fontWeight: '900', fontSize: 11 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(42, 29, 25, 0.35)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, maxHeight: '80%', borderWidth: 1, borderColor: '#E7DAD4' },
    closeBtn: { alignSelf: 'flex-end', padding: 10 },
    closeBtnTxt: { fontSize: 12, color: '#74645E', fontWeight: '900' },
    modalHeader: { fontSize: 18, fontWeight: '900', color: '#2A1D19', marginBottom: 20 },
    modalSubHeader: { fontSize: 13, fontWeight: '900', color: '#74645E', marginBottom: 10 },
    
    statBox: { flex: 1, backgroundColor: '#FFF8F5', marginHorizontal: 5, padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F0D4C8' },
    statBoxVal: { fontSize: 28, fontWeight: '900', color: '#B87460' },
    statBoxLabel: { fontSize: 11, color: '#74645E', marginTop: 5, fontWeight: '900' }
});
