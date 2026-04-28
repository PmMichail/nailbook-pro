import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export const MasterClientsScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation<any>();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/master/clients');
            setClients(res.data || []);
        } catch(e) {
            console.error('Error fetching clients', e);
        }
        setLoading(false);
    };

    const renderClient = ({ item }: { item: any }) => (
        <View style={[styles.clientCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.header}>
                <View style={styles.info}>
                    <Text style={[styles.name, { color: colors.text }]}>{item.name || 'Без імені'}</Text>
                    <Text style={{color: colors.textSecondary, marginTop: 5}} onPress={() => {
                        if (item.phone) Linking.openURL(`tel:${item.phone}`);
                    }}>📱 {item.phone || 'Немає номеру'}</Text>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    {item.isActiveClient === false && (
                        <Text style={{color: 'red', fontWeight: 'bold', fontSize: 12, marginRight: 10}}>Відключений</Text>
                    )}
                    <TouchableOpacity 
                        style={{backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10}}
                        onPress={() => navigation.navigate('ChatScreen', { roomId: `direct-${item.id}`, otherUser: item })}
                    >
                        <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 12}}>💬 Написати</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.historySection}>
                <Text style={{fontWeight: 'bold', color: colors.text, marginBottom: 5}}>Останні записи:</Text>
                {item.myAppointments && item.myAppointments.length > 0 ? (
                    item.myAppointments.map((app: any) => (
                        <Text key={app.id} style={{color: colors.textSecondary, fontSize: 12, marginBottom: 3}}>
                            📅 {new Date(app.date).toISOString().split('T')[0]} о {app.time} — {app.service || 'Послуга не вказана'}
                        </Text>
                    ))
                ) : (
                    <Text style={{color: colors.textSecondary, fontSize: 12}}>Немає записів</Text>
                )}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>Мої Клієнти</Text>
            {loading ? (
                <ActivityIndicator color={colors.primary} size="large" style={{marginTop: 50}} />
            ) : clients.length === 0 ? (
                <Text style={{color: colors.textSecondary, textAlign: 'center', marginTop: 50}}>У вас поки немає клієнтів</Text>
            ) : (
                <FlatList
                    data={clients}
                    keyExtractor={(i) => i.id}
                    renderItem={renderClient}
                    contentContainerStyle={{paddingBottom: 20}}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    clientCard: { borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 1, elevation: 3, shadowColor: '#000', shadowOffset: {width: 0,height: 2}, shadowOpacity: 0.1, shadowRadius: 5 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    info: { flex: 1 },
    name: { fontSize: 18, fontWeight: 'bold' },
    historySection: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#444', paddingTop: 10 }
});
