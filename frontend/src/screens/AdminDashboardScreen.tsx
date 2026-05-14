import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Dimensions, Animated, Easing } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import api from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenWidth = Dimensions.get('window').width;

const PulsingIndicator = () => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
    );
};

export const AdminDashboardScreen = ({ navigation }: any) => {
    const [stats, setStats] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [regions, setRegions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resStats, resEvents, resReg] = await Promise.allSettled([
                api.get('/api/admin/statistics'),
                api.get('/api/admin/activity'),
                api.get('/api/admin/regions')
            ]);
            
            if (resStats.status === 'fulfilled') setStats(resStats.value.data);
            if (resEvents.status === 'fulfilled') setEvents(resEvents.value.data || []);
            if (resReg.status === 'fulfilled') setRegions(resReg.value.data || []);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    };

    const getLast7DaysLabels = () => {
        const labels = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            labels.push(d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }));
        }
        return labels;
    };

    const chartConfig = {
      backgroundColor: '#0B1021',
      backgroundGradientFrom: '#0B1021',
      backgroundGradientTo: '#111827',
      color: (opacity = 1) => `rgba(0, 255, 170, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
      propsForDots: { r: '4', strokeWidth: '2', stroke: '#00FFAA' }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#00FFAA" /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.header}>КОМАНДНИЙ ЦЕНТР</Text>
                    <View style={styles.liveStatus}>
                        <PulsingIndicator />
                        <Text style={styles.liveText}>СИСТЕМА ОНЛАЙН</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutTxt}>ВІДКЛЮЧИТИ</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{paddingBottom: 50}} showsVerticalScrollIndicator={false}>
                
                {/* Metrics Grid */}
                <Text style={styles.sectionTitle}>ГЛОБАЛЬНІ МЕТРИКИ</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statL}>ВСЬОГО МАЙСТРІВ</Text>
                        <Text style={styles.statVal}>{stats?.totalMasters || 0}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statL}>КЛІЄНТІВ</Text>
                        <Text style={[styles.statVal, {color: '#F472B6'}]}>{stats?.totalClients || 0}</Text>
                    </View>
                </View>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statL}>PRO МАЙСТРІВ</Text>
                        <Text style={[styles.statVal, {color: '#00FFAA'}]}>{stats?.proMasters || 0}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statL}>АКТИВНІ СЬОГОДНІ</Text>
                        <Text style={[styles.statVal, {color: '#38BDF8'}]}>{stats?.activeToday || Math.floor((stats?.totalMasters || 0) * 0.3)}</Text>
                    </View>
                </View>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statL}>З АДРЕСОЮ/GEO</Text>
                        <Text style={[styles.statVal, {color: '#A78BFA'}]}>{stats?.mastersWithLocation || 0}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statL}>ЗАПИСИ СЬОГОДНІ</Text>
                        <Text style={[styles.statVal, {color: '#F5A623'}]}>{stats?.appointmentsToday || 0}</Text>
                    </View>
                </View>

                {/* Growth Chart */}
                {stats?.last7DaysRegs && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>МАТРИЦЯ РЕЄСТРАЦІЙ (7 ДНІВ)</Text>
                        <LineChart
                            data={{ labels: getLast7DaysLabels(), datasets: [{ data: stats.last7DaysRegs.some((n: number)=>n>0) ? stats.last7DaysRegs : [0,0,0,0,0,0,0] }] }}
                            width={screenWidth - 40}
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            style={{borderRadius: 12, marginTop: 10}}
                            withInnerLines={false}
                            withOuterLines={false}
                        />
                    </View>
                )}

                {/* Global Footprint */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>ГЕОПРОСТОРОВИЙ РОЗПОДІЛ</Text>
                    {regions.length > 0 ? regions.map((r, i) => {
                        const maxVal = Math.max(...regions.map(x => x.masterCount));
                        const progress = (r.masterCount / maxVal) * 100;
                        return (
                            <View key={i} style={styles.regionRow}>
                                <View style={styles.regionHeader}>
                                    <Text style={styles.regionName}>{r.region}</Text>
                                    <Text style={styles.regionCount}>{r.masterCount} Вузлів</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, {width: `${progress}%`}]} />
                                </View>
                            </View>
                        );
                    }) : (
                        <Text style={styles.emptyText}>ОЧІКУВАННЯ ДАНИХ ЛОКАЦІЇ...</Text>
                    )}
                </View>

                {/* Live Activity Feed */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>ЖИВА СТРІЧКА АКТИВНОСТІ</Text>
                    <View style={styles.terminalContainer}>
                        {events.length > 0 ? events.slice(0, 10).map((item, idx) => {
                            let typeColor = '#94A3B8';
                            let prefix = '[INFO]';
                            if (item.type === 'USER_REG') { typeColor = '#00FFAA'; prefix = '[NEW_NODE]'; }
                            if (item.type === 'NEW_APPT') { typeColor = '#38BDF8'; prefix = '[TX_SYNC]'; }

                            return (
                                <View key={item.id || idx} style={styles.terminalRow}>
                                    <Text style={styles.terminalTime}>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}</Text>
                                    <Text style={[styles.terminalPrefix, {color: typeColor}]}>{prefix}</Text>
                                    <Text style={styles.terminalText} numberOfLines={1}>{item.title}</Text>
                                </View>
                            );
                        }) : (
                            <Text style={styles.terminalText}>Очікування вхідних мережевих пакетів...</Text>
                        )}
                    </View>
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617', paddingHorizontal: 20, paddingTop: 10 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20, marginTop: 50 },
    headerTitleContainer: { flexDirection: 'column' },
    header: { fontSize: 26, fontWeight: '900', color: '#F8FAFC', letterSpacing: 2 },
    liveStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00FFAA', marginRight: 8, shadowColor: '#00FFAA', shadowOpacity: 1, shadowRadius: 5, shadowOffset: {width: 0, height: 0} },
    liveText: { color: '#00FFAA', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
    logoutTxt: { color: '#EF4444', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
    
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748B', letterSpacing: 1.5, marginBottom: 10, marginTop: 10 },
    
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statCard: { backgroundColor: 'rgba(30, 41, 59, 0.5)', flex: 1, marginHorizontal: 5, padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(51, 65, 85, 0.5)' },
    statVal: { fontSize: 32, fontWeight: '900', color: '#00FFAA', textShadowColor: 'rgba(0, 255, 170, 0.3)', textShadowOffset: {width: 0, height: 0}, textShadowRadius: 10 },
    statL: { fontSize: 11, color: '#94A3B8', marginTop: 8, letterSpacing: 1, fontWeight: '600' },
    
    card: { backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(51, 65, 85, 0.5)' },
    cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#F1F5F9', letterSpacing: 1.5, marginBottom: 15 },
    
    regionRow: { marginBottom: 15 },
    regionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    regionName: { color: '#CBD5E1', fontSize: 14, fontWeight: '600' },
    regionCount: { color: '#00FFAA', fontSize: 12, fontWeight: 'bold' },
    progressBarBg: { height: 6, backgroundColor: '#1E293B', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#00FFAA', borderRadius: 3, shadowColor: '#00FFAA', shadowOpacity: 0.8, shadowRadius: 5, shadowOffset: {width: 0, height: 0} },

    emptyText: { color: '#64748B', fontSize: 12, textAlign: 'center', fontStyle: 'italic', marginVertical: 20 },

    terminalContainer: { backgroundColor: '#0B1021', borderRadius: 8, padding: 15, borderWidth: 1, borderColor: '#1E293B' },
    terminalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    terminalTime: { color: '#64748B', fontSize: 10, marginRight: 8, fontFamily: 'Courier' },
    terminalPrefix: { fontSize: 10, fontWeight: 'bold', marginRight: 8, fontFamily: 'Courier' },
    terminalText: { color: '#E2E8F0', fontSize: 11, flex: 1, fontFamily: 'Courier' }
});
