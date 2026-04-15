import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, TouchableOpacity, ScrollView } from 'react-native';

export const NotificationSettingsScreen = () => {
  const [allPush, setAllPush] = useState(true);
  const [chatPush, setChatPush] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [botLinkCode, setBotLinkCode] = useState('');

  const generateTgLink = () => {
    // В реальності тут викликається GET /api/telegram/link
    setBotLinkCode('https://t.me/nailbook_bot?start=12345uuid');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Налаштування Сповіщень</Text>
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Push-Сповіщення (на пристрій)</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Всі сповіщення</Text>
          <Switch value={allPush} onValueChange={setAllPush} trackColor={{ true: '#FF69B4', false: '#eee' }} />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Нові повідомлення (Чат)</Text>
          <Switch value={chatPush} onValueChange={setChatPush} disabled={!allPush} trackColor={{ true: '#FF69B4', false: '#eee' }} />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Нагадування про записи (за 24г/2г)</Text>
          <Switch value={reminders} onValueChange={setReminders} disabled={!allPush} trackColor={{ true: '#FF69B4', false: '#eee' }} />
        </View>
      </View>

      <View style={styles.card}>
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
            <Text style={{ color: '#666', marginBottom: 15 }}>Отримуйте важливі сповіщення безпосередньо в Telegram.</Text>
            {botLinkCode ? (
              <View>
                <Text style={styles.linkCode}>{botLinkCode}</Text>
                <TouchableOpacity style={styles.btnSecondary}>
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
  container: { flex: 1,  padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20, marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FF69B4', marginBottom: 20 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9', paddingBottom: 10 },
  settingLabel: { fontSize: 16, color: '#333' },
  btn: { padding: 15, borderRadius: 15, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#0088cc', padding: 15, borderRadius: 15, alignItems: 'center' }, // Telegram color
  btnPrimaryText: { color: '#fff', fontWeight: 'bold' },
  linkCode: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, fontSize: 12, marginBottom: 10, fontFamily: 'monospace' },
  btnSecondary: { backgroundColor: '#eee', padding: 15, borderRadius: 15, alignItems: 'center' },
  btnSecondaryText: { color: '#333', fontWeight: 'bold' },
});
