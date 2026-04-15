import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import api from '../api/client';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';

export const SubscriptionScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [sub, setSub] = useState<any>(null);
  const [clientCount, setClientCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/master/subscription');
      setSub(res.data.subscription);
      setClientCount(res.data.activeClientsCount);
    } catch(e) {
      Alert.alert('Помилка', 'Не вдалося завантажити підписку');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    try {
       setLoading(true);
       await api.post('/api/master/subscription/trial');
       Alert.alert('Вітаємо!', 'Ваш 14-денний безкоштовний Pro тариф активовано!');
       loadSubscription();
    } catch(e: any) {
       Alert.alert('Помилка', e.response?.data?.error || 'Щось пішло не так');
       setLoading(false);
    }
  };

  const handleUpgradeToPro = async () => {
    try {
      setLoading(true);
      const res = await api.post('/api/master/subscription/checkout');
      const { paymentUrl } = res.data;
      
      const result = await WebBrowser.openBrowserAsync(paymentUrl);
      
      // Reload sub when returning from browser
      loadSubscription();
    } catch (e) {
      Alert.alert('Помилка', 'Не вдалося ініціювати оплату');
      setLoading(false);
    }
  };

  const handleCancel = async () => {
     Alert.alert('Відмінити підписку', 'Ви впевнені, що хочете відмінити підписку PRO?', [
         {text: 'Ні', style: 'cancel'},
         {text: 'Так', style: 'destructive', onPress: async () => {
             try {
                setLoading(true);
                await api.delete('/api/master/subscription');
                loadSubscription();
             } catch(e) {
                Alert.alert('Помилка', 'Не вдалося відмінити підписку');
                setLoading(false);
             }
         }}
     ])
  };

  if (loading) {
    return <View style={[styles.container, {justifyContent: 'center'}]}><ActivityIndicator size="large" color="#FF69B4" /></View>;
  }

  const isPro = sub?.plan === 'PRO' && (sub?.status === 'ACTIVE' || sub?.status === 'TRIAL');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Моя Підписка</Text>

      <View style={styles.card}>
         <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
           <Text style={styles.cardLabel}>Тариф:</Text>
           <View style={[styles.badge, isPro ? styles.badgePro : styles.badgeFree]}>
             <Text style={styles.badgeText}>{sub?.plan === 'PRO' ? (sub?.status === 'TRIAL' ? 'PRO (Trial)' : 'PRO') : 'FREE'}</Text>
           </View>
         </View>
         
         <View style={{marginVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee'}} />

         {isPro && sub?.currentPeriodEnd && (
             <Text style={{marginBottom: 10}}>Діє до: <Text style={{fontWeight: 'bold'}}>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</Text></Text>
         )}
         
         <Text style={{marginBottom: 10, fontSize: 16}}>
           Клієнтів у базі: <Text style={{fontWeight: 'bold', color: !isPro && clientCount >= 10 ? 'red' : '#333'}}>
             {clientCount} {(!isPro) && '/ 10'}
           </Text>
         </Text>

         {!isPro && clientCount >= 10 && (
             <Text style={styles.warningText}>Ви досягнули ліміту клієнтів (10). Новим користувачам буде відмовлено у реєстрації.</Text>
         )}
      </View>

      <View style={styles.features}>
         <Text style={styles.featureTitle}>✨ Переваги PRO:</Text>
         <Text style={styles.featureItem}>✔️ Безлімітна кількість клієнтів у книзі</Text>
         <Text style={styles.featureItem}>✔️ Масові розсилки Push та Telegram повідомлень</Text>
         <Text style={styles.featureItem}>✔️ Детальна статистика доходів та аналітика</Text>
      </View>

      {!isPro ? (
         <View style={{marginTop: 30}}>
            {sub?.status === 'ACTIVE' && sub?.plan === 'FREE' && (
                <TouchableOpacity style={styles.trialButton} onPress={handleStartTrial}>
                  <Text style={styles.trialButtonText}>Спробувати 14 днів безкоштовно!</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.proButton} onPress={handleUpgradeToPro}>
              <Text style={styles.proButtonText}>Оплатити PRO (299 грн/міс)</Text>
            </TouchableOpacity>
         </View>
      ) : (
         <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Відмінити підписку</Text>
         </TouchableOpacity>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1,  padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center', marginVertical: 20 },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  cardLabel: { fontSize: 18, color: '#555' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeFree: { backgroundColor: '#ccc' },
  badgePro: { backgroundColor: '#FFD700' },
  badgeText: { fontWeight: 'bold', color: '#333' },
  warningText: { color: 'red', marginTop: 10, fontSize: 13, fontStyle: 'italic' },
  features: { marginTop: 30, backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  featureTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#FF69B4' },
  featureItem: { fontSize: 14, color: '#333', marginBottom: 10 },
  trialButton: { backgroundColor: '#FFB6C1', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  trialButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  proButton: { backgroundColor: '#FF69B4', padding: 15, borderRadius: 15, alignItems: 'center' },
  proButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { marginTop: 30, backgroundColor: '#fff', padding: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  cancelButtonText: { color: 'red', fontWeight: 'bold' }
});
