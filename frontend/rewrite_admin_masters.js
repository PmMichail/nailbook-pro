const fs = require('fs');
const path = 'src/screens/AdminMastersScreen.tsx';

const content = `import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import api from '../api/client';

const screenWidth = Dimensions.get('window').width;

export const AdminMastersScreen = () => {
    const [masters, setMasters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Analytics Modal State
    const [analyticsVisible, setAnalyticsVisible] = useState(false);
    const [selectedMaster, setSelectedMaster] = useState<any>(null);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

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
                    await api.put(\`/api/admin/masters/\${masterId}/subscription\`, {
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
                    await api.put(\`/api/admin/masters/\${masterId}/subscription\`, {
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
                    const res = await api.put(\`/api/admin/masters/\${masterId}/reset-password\`);
                    Alert.alert('Успіх', \`Новий пароль для майстра:\\n\\n\${res.data.newPassword}\\n\\nОбов'язково передайте його власнику.\`);
                } catch(e) {
                    Alert.alert('Помилка', 'Не вдалося скинути пароль');
                }
            }}
        ]);
    };

    const toggleBan = async (masterId: string, currentStatus: boolean) => {
        Alert.alert('Підтвердження', currentStatus ? 'Розблокувати майстра?' : 'Тимчасово заблокувати майстра?', [
            { text: 'Скасувати', style: 'cancel' },
            { text: 'Так', onPress: async () => {
                try {
                    await api.put(\`/api/admin/users/\${masterId}/ban\`, { isBanned: !currentStatus });
                    Alert.alert('Успіх', 'Статус оновлено');
                    loadMasters();
                } catch(e) {
                    Alert.alert('Помилка', 'Не вдалося оновити статус');
                }
            }}
        ]);
    };

    const deleteUser = async (userId: string, userName: string) => {
        Alert.alert('УВАГА: НЕЗВОРОТНЯ ДІЯ', \`Ви точно хочете повністю видалити акаунт \${userName}? Всі їх прайси та записи будуть знищені!\`, [
            { text: 'Скасувати', style: 'cancel' },
            { text: 'ВИДАЛИТИ', style: 'destructive', onPress: async () => {
                try {
                    await api.delete(\`/api/admin/users/\${userId}\`);
                    Alert.alert('Успіх', 'Акаунт видалено');
                    loadMasters();
                } catch(e) {
                    Alert.alert('Помилка', 'Не вдалося видалити');
                }
            }}
        ]);
    };

    const openAnalytics = async (master: any) => {
        setSelectedMaster(master);
        setAnalyticsVisible(true);
        setLoadingAnalytics(true);
        try {
            const res = await api.get(\`/api/admin/masters/\${master.id}/analytics\`);
            setAnalyticsData(res.data);
        } catch(e) {
            Alert.alert('Помилка', 'Не вдалося завантажити аналітику');
            setAnalyticsVisible(false);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const chartConfig = {
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      color: (opacity = 1) => \`rgba(200, 141, 122, \${opacity})\`,
      labelColor: (opacity = 1) => \`rgba(0, 0, 0, \${opacity})\`,
      barPercentage: 0.5,
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#C88D7A" /></View>;

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
                            <View style={{flexDirection: 'row', gap: 5}}>
                                {m.isBanned && (
                                    <View style={[styles.badge, { backgroundColor: '#ffcccc' }]}>
                                        <Text style={[styles.badgeText, {color: '#cc0000'}]}>BAN</Text>
                                    </View>
                                )}
                                <View style={[styles.badge, { backgroundColor: isPro ? '#FFD700' : '#ddd' }]}>
                                    <Text style={styles.badgeText}>{isPro ? 'PRO' : 'FREE'}</Text>
                                </View>
                            </View>
                        </View>
                        
                        {isPro && sub.currentPeriodEnd && (
                            <Text style={styles.expText}>PRO діє до: {new Date(sub.currentPeriodEnd).toLocaleDateString()}</Text>
                        )}

                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.downgradeBtn, {backgroundColor: '#E6F4EA'}]} onPress={() => openAnalytics(m)}>
                                <Text style={[styles.btnTextDowngrade, {color: '#2E7D32'}]}>📊 Аналітика</Text>
                            </TouchableOpacity>
                            {!isPro ? (
                                <TouchableOpacity style={[styles.upgradeBtn, {marginLeft: 10}]} onPress={() => grantProStatus(m.id)}>
                                    <Text style={styles.btnText}>+ PRO</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={[styles.downgradeBtn, {marginLeft: 10}]} onPress={() => grantFreeStatus(m.id)}>
                                    <Text style={styles.btnTextDowngrade}>Скинути на FREE</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        <View style={[styles.actions, {marginTop: 10}]}>
                            <TouchableOpacity style={[styles.downgradeBtn, {backgroundColor: '#eee'}]} onPress={() => resetPassword(m.id)}>
                                <Text style={[styles.btnTextDowngrade, {color: '#555'}]}>Пароль</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.downgradeBtn, {backgroundColor: m.isBanned ? '#4CAF50' : '#8b0000', marginLeft: 10}]} onPress={() => toggleBan(m.id, m.isBanned)}>
                                <Text style={[styles.btnTextDowngrade, {color: '#fff'}]}>{m.isBanned ? 'Розбан' : 'Бан'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.downgradeBtn, {backgroundColor: 'transparent', marginLeft: 'auto', borderWidth: 1, borderColor: '#ff0000'}]} onPress={() => deleteUser(m.id, m.name)}>
                                <Text style={[styles.btnTextDowngrade, {color: '#ff0000'}]}>Видалити</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            })}
            <View style={{height: 50}} />

            {/* Analytics Modal */}
            <Modal visible={analyticsVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setAnalyticsVisible(false)}>
                            <Text style={styles.closeBtnTxt}>✕</Text>
                        </TouchableOpacity>
                        
                        <Text style={styles.modalHeader}>Аналітика: {selectedMaster?.name}</Text>
                        
                        {loadingAnalytics ? (
                            <View style={{padding: 50}}><ActivityIndicator size="large" color="#C88D7A" /></View>
                        ) : analyticsData ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20}}>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statBoxVal}>{analyticsData.totalClients}</Text>
                                        <Text style={styles.statBoxLabel}>Клієнтів</Text>
                                    </View>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statBoxVal}>{analyticsData.totalAppointments}</Text>
                                        <Text style={styles.statBoxLabel}>Всього Записів</Text>
                                    </View>
                                </View>

                                <Text style={styles.modalSubHeader}>Статус Записів</Text>
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
    container: { flex: 1, backgroundColor: '#F0F4F8', padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20, marginTop: 10 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    subtext: { color: '#666', fontSize: 13, marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    badgeText: { fontWeight: 'bold', color: '#333', fontSize: 12 },
    expText: { color: '#ff8c00', marginTop: 10, fontWeight: 'bold' },
    actions: { flexDirection: 'row', marginTop: 15, justifyContent: 'flex-start', flexWrap: 'wrap' },
    upgradeBtn: { backgroundColor: '#C88D7A', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
    downgradeBtn: { backgroundColor: '#ffebe6', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    btnTextDowngrade: { color: 'red', fontWeight: 'bold', fontSize: 13 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#F0F4F8', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
    closeBtn: { alignSelf: 'flex-end', padding: 10 },
    closeBtnTxt: { fontSize: 20, color: '#333', fontWeight: 'bold' },
    modalHeader: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    modalSubHeader: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 10 },
    statBox: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 10, marginHorizontal: 5, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    statBoxVal: { fontSize: 24, fontWeight: 'bold', color: '#C88D7A' },
    statBoxLabel: { fontSize: 12, color: '#666', marginTop: 5 }
});
`;

fs.writeFileSync(path, content, 'utf8');
console.log("Rewrote AdminMastersScreen.tsx");
