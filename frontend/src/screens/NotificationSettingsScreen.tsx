import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';

export const NotificationSettingsScreen = () => {
  const { colors } = useTheme();
  const [allPush, setAllPush] = useState(true);
  const [chatPush, setChatPush] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [botLinkCode, setBotLinkCode] = useState('');

  const generateTgLink = () => {
    // В реальності тут викликається GET /api/telegram/link
    setBotLinkCode('https://t.me/nailbook_bot?start=12345uuid');
  };

  const openTgLink = async () => {
    if (!botLinkCode) return;
    await Clipboard.setStringAsync(botLinkCode);
    Linking.openURL(botLinkCode);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.kicker}>NOTIFICATIONS</Text>
        <Text style={[styles.header, { color: colors.text }]}>Налаштування Сповіщень</Text>
      </View>
      
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.sectionTitle}>Push-Сповіщення (на пристрій)</Text>
        
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Всі сповіщення</Text>
          <Switch value={allPush} onValueChange={setAllPush} trackColor={{ true: '#C88D7A', false: '#eee' }} />
        </View>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Нові повідомлення (Чат)</Text>
          <Switch value={chatPush} onValueChange={setChatPush} disabled={!allPush} trackColor={{ true: '#C88D7A', false: '#eee' }} />
        </View>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Нагадування про записи (за 24г/2г)</Text>
          <Switch value={reminders} onValueChange={setReminders} disabled={!allPush} trackColor={{ true: '#C88D7A', false: '#eee' }} />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.sectionTitle}>Telegram Бот</Text>
        {telegramLinked ? (
          <View>
            <Text style={{ color: '#4CAF50', fontWeight: 'bold', marginBottom: 10 }}>✅ Telegram підключено (@username)</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#ffebee' }]} onPress={() => setTelegramLinked(false)}>
              <Text style={{ color: '#f44336' }}>Відключити Telegram</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={{ color: colors.textSecondary, marginBottom: 15 }}>Отримуйте важливі сповіщення безпосередньо в Telegram.</Text>
            {botLinkCode ? (
              <View>
                <Text style={styles.linkCode}>{botLinkCode}</Text>
                <TouchableOpacity style={styles.btnSecondary} onPress={openTgLink}>
                  <Text style={styles.btnSecondaryText}>Скопіювати або Відкрити</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.btnPrimary} onPress={generateTgLink}>
                <Text style={styles.btnPrimaryText}>Згенерувати лінк для підключення</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  heroCard: { marginTop: 40, borderRadius: 28, borderWidth: 1, padding: 22, marginBottom: 18, shadowColor: '#C88D7A', shadowOffset: {width: 0, height: 12}, shadowOpacity: 0.1, shadowRadius: 22, elevation: 4 },
  kicker: { color: '#C88D7A', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  header: { fontSize: 30, fontWeight: '900' },
  card: { borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.07, shadowRadius: 18, elevation: 4, borderWidth: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#C88D7A', marginBottom: 20 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9', paddingBottom: 10 },
  settingLabel: { fontSize: 16, color: '#333' },
  btn: { padding: 15, borderRadius: 15, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#0088cc', padding: 15, borderRadius: 15, alignItems: 'center' }, // Telegram color
  btnPrimaryText: { color: '#fff', fontWeight: 'bold' },
  linkCode: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, fontSize: 12, marginBottom: 10, fontFamily: 'monospace' },
  btnSecondary: { backgroundColor: '#eee', padding: 15, borderRadius: 15, alignItems: 'center' },
  btnSecondaryText: { color: '#333', fontWeight: 'bold' },
});
