import React, { useState, useEffect } from 'react';
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
            <Text style={styles.header}>АКТИВНІ ВУЗЛИ</Text>
            {masters.map(m => {
                return (
                    <View key={m.id} style={styles.card}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <View>
                                <Text style={styles.name}>{m.name}</Text>
                                <Text style={styles.subtext}>{m.phone || m.email}</Text>
                                <Text style={styles.subtext}>Аплінк: {new Date(m.createdAt).toLocaleDateString()}</Text>
                            </View>
                            <View style={{flexDirection: 'row', gap: 5}}>
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
