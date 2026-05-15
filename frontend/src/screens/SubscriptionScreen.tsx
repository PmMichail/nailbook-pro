// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api/client';
import { useTranslation } from 'react-i18next';
import Purchases from 'react-native-purchases';
import { useTheme } from '../context/ThemeContext';

const API_KEY_IOS = "appl_DhQYpxSPNdHufxhMEhLdzmltNlV";
const API_KEY_ANDROID = "goog_zwzVaWsrqGBNEpPxFoHxsUUBFdu";
const PRIVACY_URL = 'https://grandprestig.dp.ua/info/privacy.html';
const TERMS_URL = 'https://grandprestig.dp.ua/info/terms.html';

export const SubscriptionScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [sub, setSub] = useState<any>(null);
  const [clientCount, setClientCount] = useState<number>(0);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

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
            setSelectedPackage(offerings.current.availablePackages[0]);
         }
     } catch(e) {
         console.warn('Subscription products are not available yet.', e);
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
    if (purchasing) return;
    try {
      setPurchasing(true);
      if (selectedPackage) {
        const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
        if (customerInfo.entitlements.active['pro']) {
          Alert.alert('Успіх', 'Підписка PRO активована!');
        } else {
          Alert.alert('Покупка обробляється', 'Транзакція завершена, але PRO ще не активовано. Спробуйте відновити покупки.');
        }
      } else {
        Alert.alert('Підписка недоступна', 'Продукт підписки тимчасово недоступний. Спробуйте ще раз пізніше.');
      }
      await loadSubscription();
    } catch (e: any) {
      if (!e.userCancelled) {
         Alert.alert('Помилка оплати', e?.message || 'Не вдалося завершити покупку. Спробуйте ще раз.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (purchasing) return;
    try {
      setPurchasing(true);
      const customerInfo = await Purchases.restorePurchases();
      const isActive = !!customerInfo?.entitlements?.active?.pro;
      Alert.alert(isActive ? 'Покупки відновлено' : 'Активних покупок не знайдено', isActive ? 'PRO-підписка активна.' : 'Для цього акаунта немає активної PRO-підписки.');
      await loadSubscription();
    } catch(e: any) {
      Alert.alert('Помилка', e?.message || 'Не вдалося відновити покупки');
    } finally {
      setPurchasing(false);
    }
  };

  const openLegalLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) Linking.openURL(url);
  };

  if (loading) {
    return <View style={[styles.container, {backgroundColor: colors.background, justifyContent: 'center'}]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const isPro = sub?.plan === 'PRO' && (sub?.status === 'ACTIVE' || sub?.status === 'TRIAL');
  const product = selectedPackage?.product;
  const priceText = product?.priceString || 'ціна відображається перед оплатою';
  const periodText = 'щомісячна автоматично поновлювана підписка';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={isDark ? ['#2A1630', '#120A18'] : ['#FFF3F7', '#F8E7DD']} style={styles.heroCard}>
        <Text style={styles.kicker}>NAILSBOOK PRO</Text>
        <Text style={[styles.title, { color: colors.text }]}>Преміум-підписка для майстра</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Більше клієнтів, без обмежень бази, професійний кабінет і преміум-інструменти для салону.</Text>
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>{priceText}</Text>
          <Text style={styles.periodText}>{periodText}</Text>
        </View>
      </LinearGradient>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
         <View style={styles.statusRow}>
           <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Поточний тариф</Text>
           <View style={[styles.badge, isPro ? styles.proBadge : { backgroundColor: colors.border }]}>
             <Text style={styles.badgeText}>{sub?.plan === 'PRO' ? (sub?.status === 'TRIAL' ? 'PRO (Trial)' : 'PRO') : 'FREE'}</Text>
           </View>
         </View>

         {isPro && sub?.currentPeriodEnd && (
             <Text style={[styles.metaText, { color: colors.textSecondary }]}>Діє до: <Text style={{fontWeight: 'bold', color: colors.text}}>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</Text></Text>
         )}
         
         <Text style={[styles.metaText, { color: colors.textSecondary }]}>
           Клієнтів у базі: <Text style={{fontWeight: 'bold', color: !isPro && clientCount >= 10 ? '#ff4444' : colors.text}}>
             {clientCount} {(!isPro) && '/ 10'}
           </Text>
         </Text>

         {!isPro && clientCount >= 10 && (
             <Text style={styles.warningText}>Ліміт клієнтів досягнуто. Нові реєстрації призупинено.</Text>
         )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {['Необмежена база клієнтів', 'Автоматичні нагадування та premium CRM', 'Пріоритетні інструменти для розвитку салону'].map((item) => (
          <View key={item} style={styles.featureRow}><Text style={styles.featureIcon}>✓</Text><Text style={[styles.featureText, { color: colors.text }]}>{item}</Text></View>
        ))}
      </View>

      {!isPro || sub?.status === 'TRIAL' ? (
         <View style={styles.purchaseBlock}>
            <TouchableOpacity activeOpacity={0.85} disabled={purchasing || !selectedPackage} style={[styles.proButton, (purchasing || !selectedPackage) && styles.disabledButton]} onPress={handleUpgradeToPro}>
              {purchasing ? <ActivityIndicator color="#fff" /> : <Text style={styles.proButtonText}>Оновити до PRO</Text>}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} disabled={purchasing} style={[styles.restoreButton, { borderColor: colors.border }]} onPress={handleRestorePurchases}>
              <Text style={[styles.restoreButtonText, { color: colors.text }]}>Відновити покупки</Text>
            </TouchableOpacity>
         </View>
      ) : (
         <View style={[styles.successCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.successIcon}>✦</Text>
            <Text style={[styles.successTitle, { color: colors.text }]}>Ви використовуєте PRO</Text>
            <Text style={[styles.successText, { color: colors.textSecondary }]}>Усі преміум функції розблоковано. Підпискою можна керувати в налаштуваннях вашого облікового запису.</Text>
         </View>
      )}

      <View style={styles.legalBlock}>
        <Text style={[styles.legalText, { color: colors.textSecondary }]}>NailsBook Pro — {priceText}. Підписка поновлюється автоматично, доки її не скасовано щонайменше за 24 години до завершення поточного періоду.</Text>
        <View style={styles.legalLinksRow}>
          <TouchableOpacity hitSlop={12} onPress={() => openLegalLink(PRIVACY_URL)}><Text style={styles.legalLink}>Privacy Policy</Text></TouchableOpacity>
          <TouchableOpacity hitSlop={12} onPress={() => openLegalLink(TERMS_URL)}><Text style={styles.legalLink}>Terms of Use</Text></TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  heroCard: { borderRadius: 28, padding: 24, marginTop: 16, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(200, 141, 122, 0.25)' },
  kicker: { color: '#C88D7A', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 12 },
  pricePill: { alignSelf: 'flex-start', backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, marginTop: 18 },
  priceText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  periodText: { color: '#F8D8CD', fontSize: 11, marginTop: 3 },
  card: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 14, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  badge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  proBadge: { backgroundColor: '#C88D7A' },
  badgeText: { fontWeight: '900', color: '#fff', fontSize: 13 },
  metaText: { marginTop: 8, fontSize: 15 },
  warningText: { color: '#D92D20', marginTop: 12, fontSize: 14, fontWeight: '700' },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 7 },
  featureIcon: { width: 26, height: 26, borderRadius: 13, textAlign: 'center', lineHeight: 26, overflow: 'hidden', backgroundColor: '#EAD7CF', color: '#7A3E2F', fontWeight: '900', marginRight: 12 },
  featureText: { fontSize: 16, fontWeight: '700', flex: 1 },
  purchaseBlock: { marginTop: 6 },
  proButton: { minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', shadowColor: '#111827', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.22, shadowRadius: 18, elevation: 8 },
  disabledButton: { opacity: 0.55 },
  proButtonText: { color: '#fff', fontWeight: '900', fontSize: 17, letterSpacing: 0.3 },
  restoreButton: { minHeight: 50, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  restoreButtonText: { fontWeight: '800', fontSize: 15 },
  successCard: { marginTop: 8, padding: 22, borderRadius: 24, borderWidth: 1, alignItems: 'center' },
  successIcon: { fontSize: 34, color: '#C88D7A', marginBottom: 8 },
  successTitle: { fontWeight: '900', fontSize: 20, marginBottom: 8 },
  successText: { textAlign: 'center', lineHeight: 20 },
  legalBlock: { marginTop: 20, paddingHorizontal: 4 },
  legalText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  legalLinksRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 16, marginTop: 14 },
  legalLink: { color: '#C88D7A', fontSize: 14, fontWeight: '900', textDecorationLine: 'underline' },
});
