import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import Constants from 'expo-constants';

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { t, i18n } = useTranslation();
  const { colors, isDark, toggleTheme } = useTheme();
  const [userRole, setUserRole] = useState<string | null>(null);

  React.useEffect(() => {
    AsyncStorage.getItem('user').then(uStr => {
      if (uStr) {
        try {
          setUserRole(JSON.parse(uStr).role);
        } catch(e){}
      }
    });
  }, []);

  const changeLanguage = () => {
      Alert.alert(t('language'), 'Оберіть мову / Choose language', [
          { text: 'Українська', onPress: () => i18n.changeLanguage('uk') },
          { text: 'English', onPress: () => i18n.changeLanguage('en') },
          { text: 'Polski', onPress: () => i18n.changeLanguage('pl') },
          { text: 'Deutsch', onPress: () => i18n.changeLanguage('de') },
          { text: t('cancel'), style: 'cancel' }
      ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>{t('settings')}</Text>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings')}</Text>
        
        <View style={styles.menuItem}>
          <Text style={[styles.menuText, { color: colors.text }]}>{t('darkTheme')}</Text>
          <Switch value={isDark} onValueChange={toggleTheme} />
        </View>
        
        <TouchableOpacity style={styles.menuItem} onPress={changeLanguage}>
          <Text style={[styles.menuText, { color: colors.text }]}>{t('language')}</Text>
          <Text style={styles.statusText}>{i18n.language.toUpperCase()} ›</Text>
        </TouchableOpacity>
        
        {userRole !== 'CLIENT' && (
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SubscriptionScreen')}>
            <Text style={[styles.menuText, { color: colors.text }]}>{t('manageSubscription', {defaultValue: 'Керувати підпискою'})}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('profile.dataSecurity', {defaultValue: 'Дані та Безпека'})}</Text>
        
        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]}>
          <Text style={[styles.menuText, { color: 'red' }]}>{t('deleteAccount')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>NailsBook Pro v{Constants.expoConfig?.version || '1.0.1'}</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://telegra.ph/Poltika-konfdencijnost-NailsBook-Pro-05-02')}><Text style={styles.footerLink}>{t('privacyPolicy', {defaultValue: 'Політика конфіденційності'})}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://telegra.ph/Umovi-vikoristannya-NailsBook-Pro-05-02')}><Text style={styles.footerLink}>{t('termsOfUse', {defaultValue: 'Умови використання'})}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://t.me/nailbook_support')}><Text style={styles.footerLink}>{t('support', {defaultValue: 'Підтримка (Telegram)'})}</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1,  paddingHorizontal: 15 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 50, marginBottom: 20, paddingHorizontal: 5 },
  section: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 20, padding: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#999', textTransform: 'uppercase', paddingHorizontal: 15, paddingTop: 10, paddingBottom: 5 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuText: { fontSize: 16, color: '#333' },
  menuArrow: { fontSize: 18, color: '#ccc' },
  statusText: { fontSize: 14, color: '#999' },
  footer: { alignItems: 'center', marginBottom: 50, marginTop: 10 },
  footerText: { color: '#999', fontSize: 12, marginBottom: 10 },
  footerLink: { color: '#C88D7A', fontSize: 12, marginBottom: 5, textDecorationLine: 'underline' }
});
