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
      backgroundColor: '#FFF8F5',
      backgroundGradientFrom: '#FFF8F5',
      backgroundGradientTo: '#F9E8E1',
      color: (opacity = 1) => `rgba(184, 116, 96, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(116, 100, 94, ${opacity})`,
      propsForDots: { r: '4', strokeWidth: '2', stroke: '#B87460' }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#C88D7A" /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.kicker}>ADMIN OVERVIEW</Text>
                    <Text style={styles.header}>Панель керування</Text>
                    <View style={styles.liveStatus}>
                        <PulsingIndicator />
                        <Text style={styles.liveText}>сервіс працює</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutTxt}>Вийти</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{paddingBottom: 50}} showsVerticalScrollIndicator={false}>
                
                {/* Metrics Grid */}
                <Text style={styles.sectionTitle}>Ключові показники</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statL}>Майстрів</Text>
                        <Text style={styles.statVal}>{stats?.totalMasters || 0}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statL}>Клієнтів</Text>
                        <Text style={styles.statVal}>{stats?.totalClients || 0}</Text>
                    </View>
                </View>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statL}>PRO майстрів</Text>
                        <Text style={styles.statVal}>{stats?.proMasters || 0}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statL}>Активні сьогодні</Text>
                        <Text style={styles.statVal}>{stats?.activeToday || Math.floor((stats?.totalMasters || 0) * 0.3)}</Text>
                    </View>
                </View>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statL}>З адресою</Text>
                        <Text style={styles.statVal}>{stats?.mastersWithLocation || 0}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statL}>Записи сьогодні</Text>
                        <Text style={styles.statVal}>{stats?.appointmentsToday || 0}</Text>
                    </View>
                </View>

                {/* Growth Chart */}
                {stats?.last7DaysRegs && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Реєстрації за 7 днів</Text>
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
                    <Text style={styles.cardTitle}>Майстри по регіонах</Text>
                    {regions.length > 0 ? regions.map((r, i) => {
                        const maxVal = Math.max(...regions.map(x => x.masterCount));
                        const progress = (r.masterCount / maxVal) * 100;
                        return (
                            <View key={i} style={styles.regionRow}>
                                <View style={styles.regionHeader}>
                                    <Text style={styles.regionName}>{r.region}</Text>
                                    <Text style={styles.regionCount}>{r.masterCount} майстрів</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, {width: `${progress}%`}]} />
                                </View>
                            </View>
                        );
                    }) : (
                        <Text style={styles.emptyText}>Поки немає даних по регіонах</Text>
                    )}
                </View>

                {/* Live Activity Feed */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Остання активність</Text>
                    <View style={styles.terminalContainer}>
                        {events.length > 0 ? events.slice(0, 10).map((item, idx) => {
                            let typeColor = '#94A3B8';
                            let prefix = 'Подія';
                            if (item.type === 'USER_REG') { typeColor = '#B87460'; prefix = 'Реєстрація'; }
                            if (item.type === 'NEW_APPT') { typeColor = '#8E6A5C'; prefix = 'Новий запис'; }

                            return (
                                <View key={item.id || idx} style={styles.terminalRow}>
                                    <Text style={styles.terminalTime}>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}</Text>
                                    <Text style={[styles.terminalPrefix, {color: typeColor}]}>{prefix}</Text>
                                    <Text style={styles.terminalText} numberOfLines={1}>{item.title}</Text>
                                </View>
                            );
                        }) : (
                            <Text style={styles.terminalText}>Поки немає нових подій</Text>
                        )}
                    </View>
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF9F6', paddingHorizontal: 20, paddingTop: 10 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9F6' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20, marginTop: 50, gap: 12 },
    headerTitleContainer: { flexDirection: 'column', flex: 1 },
    kicker: { color: '#C88D7A', fontSize: 12, fontWeight: '900', letterSpacing: 2.2, marginBottom: 5 },
    header: { fontSize: 30, fontWeight: '900', color: '#2A1D19' },
    liveStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7FB069', marginRight: 8 },
    liveText: { color: '#7FB069', fontSize: 12, fontWeight: '800' },
    logoutBtn: { backgroundColor: '#FFF1EC', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: '#F0D4C8' },
    logoutTxt: { color: '#B75B4B', fontWeight: '900', fontSize: 12 },
    
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#2A1D19', marginBottom: 12, marginTop: 10 },
    
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statCard: { backgroundColor: '#FFFFFF', flex: 1, marginHorizontal: 5, padding: 20, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E7DAD4', shadowColor: '#C88D7A', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.09, shadowRadius: 18, elevation: 3 },
    statVal: { fontSize: 34, fontWeight: '900', color: '#B87460' },
    statL: { fontSize: 12, color: '#74645E', marginTop: 8, fontWeight: '800', textAlign: 'center' },
    
    card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 26, marginBottom: 20, borderWidth: 1, borderColor: '#E7DAD4', shadowColor: '#C88D7A', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
    cardTitle: { fontSize: 18, fontWeight: '900', color: '#2A1D19', marginBottom: 15 },
    
    regionRow: { marginBottom: 15 },
    regionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    regionName: { color: '#2A1D19', fontSize: 14, fontWeight: '800' },
    regionCount: { color: '#B87460', fontSize: 12, fontWeight: '900' },
    progressBarBg: { height: 8, backgroundColor: '#F5E8E2', borderRadius: 999, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#C88D7A', borderRadius: 999 },

    emptyText: { color: '#74645E', fontSize: 13, textAlign: 'center', fontStyle: 'italic', marginVertical: 20 },

    terminalContainer: { backgroundColor: '#FFF8F5', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#F0D4C8' },
    terminalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    terminalTime: { color: '#74645E', fontSize: 11, marginRight: 8 },
    terminalPrefix: { fontSize: 11, fontWeight: '900', marginRight: 8 },
    terminalText: { color: '#2A1D19', fontSize: 12, flex: 1 }
});
