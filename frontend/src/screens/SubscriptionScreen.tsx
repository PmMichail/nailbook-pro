import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import api from '../api/client';
import { useTranslation } from 'react-i18next';
import Purchases from 'react-native-purchases';

// Keys provided by user
const API_KEY_IOS = "appl_DhQYpxSPNdHufxhMEhLdzmltNlV";
const API_KEY_ANDROID = "goog_zwzVaWsrqGBNEpPxFoHxsUUBFdu";

export const SubscriptionScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
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
      
      // RevenueCat Purchase Flow
      if (packages.length > 0) {
        const { customerInfo } = await Purchases.purchasePackage(packages[0]);
        if (customerInfo.entitlements.active['pro']) {
          // Trigger backend refresh
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
    return <View style={[styles.container, {justifyContent: 'center'}]}><ActivityIndicator size="large" color="#C88D7A" /></View>;
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
         <Text style={styles.featureTitle}>Тариф LITE (Безкоштовно):</Text>
         <Text style={styles.featureItem}>✔️ Базовий календар записів</Text>
         <Text style={styles.featureItem}>❌ Обмеження: до 10 активних клієнтів (інші заблоковані)</Text>
         <Text style={styles.featureItem}>❌ Обмеження: до 5 фото в портфоліо та 1 в загальну стрічку</Text>
         <Text style={styles.featureItem}>❌ Обмеження: лише 1 послуга в прайс-листі</Text>
         <Text style={styles.featureItem}>❌ Немає масових розсилок та аналітики</Text>
         
         <Text style={[styles.featureTitle, {marginTop: 20}]}>✨ Тариф PRO (299 грн/міс):</Text>
         <Text style={styles.featureItem}>✔️ Безлімітна кількість клієнтів</Text>
         <Text style={styles.featureItem}>✔️ Безлімітне портфоліо та прайс-лист</Text>
         <Text style={styles.featureItem}>✔️ Масові розсилки (Push та Telegram)</Text>
         <Text style={styles.featureItem}>✔️ Детальна фінансова статистика</Text>
         <Text style={styles.featureItem}>✔️ Пріоритетна підтримка</Text>
      </View>

      {!isPro || sub?.status === 'TRIAL' ? (
         <View style={{marginTop: 30}}>
            {sub?.status === 'ACTIVE' && sub?.plan === 'FREE' && (
                <TouchableOpacity style={styles.trialButton} onPress={handleStartTrial}>
                  <Text style={styles.trialButtonText}>Спробувати 14 днів безкоштовно!</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.proButton} onPress={handleUpgradeToPro}>
              <Text style={styles.proButtonText}>Оплатити PRO (через App Store)</Text>
            </TouchableOpacity>
         </View>
      ) : (
         <View style={{marginTop: 30, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10, borderWidth: 1, borderColor: '#eee'}}>
            <Text style={{textAlign: 'center', color: '#555'}}>Ваша підписка активна і не потребує ручного скасування. Вона автоматично перейде на тариф LITE після закінчення терміну дії.</Text>
         </View>
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
  featureTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#C88D7A' },
  featureItem: { fontSize: 14, color: '#333', marginBottom: 10 },
  trialButton: { backgroundColor: '#e0c0b4', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  trialButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  proButton: { backgroundColor: '#C88D7A', padding: 15, borderRadius: 15, alignItems: 'center' },
  proButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { marginTop: 30, backgroundColor: '#fff', padding: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  cancelButtonText: { color: 'red', fontWeight: 'bold' }
});
