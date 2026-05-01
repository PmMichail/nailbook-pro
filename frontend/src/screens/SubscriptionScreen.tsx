// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import api from '../api/client';
import { useTranslation } from 'react-i18next';
import Purchases from 'react-native-purchases';
import { useTheme } from '../context/ThemeContext';

const API_KEY_IOS = "appl_DhQYpxSPNdHufxhMEhLdzmltNlV";
const API_KEY_ANDROID = "goog_zwzVaWsrqGBNEpPxFoHxsUUBFdu";

export const SubscriptionScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [sub, setSub] = useState<any>(null);
  const [clientCount, setClientCount] = useState<number>(0);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setupPurchases();
    loadSubscription();
  }, []);

  const setupPurchases = async () => {
     try {
         Purchases.configure({ apiKey: Platform.OS === 'ios' ? API_KEY_IOS : API_KEY_ANDROID });
         const offerings = await Purchases.getOfferings();
         if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
            setPackages(offerings.current.availablePackages);
         }
     } catch(e) {
         console.warn("RevenueCat not fully configured yet.");
     }
  };

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

  const handleUpgradeToPro = async () => {
    try {
      setLoading(true);
      if (packages.length > 0) {
        const { customerInfo } = await Purchases.purchasePackage(packages[0]);
        if (customerInfo.entitlements.active['pro']) {
          Alert.alert('Успіх', 'Підписка PRO активована!');
        }
      } else {
        Alert.alert('Увага', 'Пакети підписок наразі не налаштовані в Apple/Google.');
      }
      loadSubscription();
    } catch (e: any) {
      if (!e.userCancelled) {
         Alert.alert('Помилка', 'Не вдалося ініціювати оплату Apple/Google');
      }
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={[styles.container, {backgroundColor: colors.background, justifyContent: 'center'}]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const isPro = sub?.plan === 'PRO' && (sub?.status === 'ACTIVE' || sub?.status === 'TRIAL');

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Керування Підпискою</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
         <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
           <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Поточний тариф:</Text>
           <View style={[styles.badge, isPro ? { backgroundColor: colors.primary } : { backgroundColor: colors.border }]}>
             <Text style={styles.badgeText}>{sub?.plan === 'PRO' ? (sub?.status === 'TRIAL' ? 'PRO (Trial)' : 'PRO') : 'FREE'}</Text>
           </View>
         </View>
         
         <View style={{marginVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.border}} />

         {isPro && sub?.currentPeriodEnd && (
             <Text style={{marginBottom: 10, color: colors.textSecondary}}>Діє до: <Text style={{fontWeight: 'bold', color: colors.text}}>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</Text></Text>
         )}
         
         <Text style={{marginBottom: 10, fontSize: 16, color: colors.textSecondary}}>
           Клієнтів у базі: <Text style={{fontWeight: 'bold', color: !isPro && clientCount >= 10 ? '#ff4444' : colors.text}}>
             {clientCount} {(!isPro) && '/ 10'}
           </Text>
         </Text>

         {!isPro && clientCount >= 10 && (
             <Text style={styles.warningText}>Ліміт клієнтів досягнуто. Нові реєстрації призупинено.</Text>
         )}
      </View>

      {!isPro || sub?.status === 'TRIAL' ? (
         <View style={{marginTop: 40}}>
            <Text style={{textAlign: 'center', color: colors.textSecondary, marginBottom: 20, fontSize: 16}}>Переходьте на PRO, щоб зняти всі обмеження та отримати доступ до преміум функцій!</Text>
            <TouchableOpacity style={[styles.proButton, { backgroundColor: colors.text, shadowColor: colors.text }]} onPress={handleUpgradeToPro}>
              <Text style={[styles.proButtonText, { color: colors.background }]}>✨ Оновити до PRO</Text>
            </TouchableOpacity>
         </View>
      ) : (
         <View style={{marginTop: 40, padding: 20, backgroundColor: colors.card, borderRadius: 15, borderWidth: 1, borderColor: colors.border, alignItems: 'center'}}>
            <Text style={{fontSize: 24, marginBottom: 10}}>🎉</Text>
            <Text style={{textAlign: 'center', color: colors.text, fontWeight: 'bold', fontSize: 18, marginBottom: 10}}>Ви використовуєте PRO</Text>
            <Text style={{textAlign: 'center', color: colors.textSecondary}}>Усі преміум функції розблоковано. Підписка керується автоматично через ваш обліковий запис Apple або Google.</Text>
         </View>
      )}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1,  padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 30 },
  card: { borderRadius: 20, padding: 25, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  cardLabel: { fontSize: 18 },
  badge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  badgeText: { fontWeight: 'bold', color: '#fff', fontSize: 14 },
  warningText: { color: '#ff4444', marginTop: 15, fontSize: 14, fontWeight: '600' },
  proButton: { padding: 18, borderRadius: 15, alignItems: 'center', elevation: 5, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3 },
  proButtonText: { fontWeight: 'bold', fontSize: 18 },
});
